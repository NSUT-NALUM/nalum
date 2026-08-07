const axios = require("axios");
const { getRedisClient } = require("../config/redis.config");
const Profile = require("../models/user/profile.model");
const {
  ALUMNI_MAP_LOCATIONS_KEY,
  invalidateAlumniMapCache,
} = require("../config/cacheKeys");

const QUEUE_KEY = "geocoding:queue";
const PROCESSING_KEY = "geocoding:processing";
const IN_PROGRESS_KEY = "geocoding:in_progress";
const ERROR_COUNT_KEY = "geocoding:error_count";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

// Rate limiting: 1 request per second
const RATE_LIMIT_MS = 1000;

// Max attempts per queue item before it is dropped (dead-lettered) to avoid
// infinite retry loops on permanent failures (e.g. ungeocodable city names).
const MAX_RETRIES = 5;

// Exponential backoff delays after rate-limit responses
const BACKOFF_DELAYS = {
  1: 5 * 60 * 1000, // 5 minutes
  2: 15 * 60 * 1000, // 15 minutes
  3: 60 * 60 * 1000, // 1 hour
};

let isProcessing = false;
let processingInterval = null;

// Add a user to the geocoding queue
async function addToQueue(userId, city, country) {
  try {
    const redis = getRedisClient();
    const queueItem = JSON.stringify({
      userId,
      city,
      country,
      addedAt: Date.now(),
    });
    await redis.rPush(QUEUE_KEY, queueItem);
    console.log(
      `Added user ${userId} to geocoding queue (${city}, ${country})`,
    );

    // Start processing if not already running
    if (!isProcessing) {
      startProcessing();
    }
  } catch (error) {
    console.error("Error adding to geocoding queue:", error);
    throw error;
  }
}

const {
  getCanonicalLocation,
  haversineDistanceKm,
  normalizeCityAndCountry,
} = require("../config/canonicalCities");

// Geocode a city/country using OpenStreetMap Nominatim API with canonical validation
async function geocodeLocation(city, country) {
  try {
    const canonical = getCanonicalLocation(city, country);
    if (canonical.isCanonical) {
      console.log(
        `✓ Using canonical coordinates for ${city}, ${country}: lat=${canonical.lat}, lng=${canonical.lng}`
      );
      return [canonical.lat, canonical.lng];
    }

    const query = `${city}, ${country}`;
    const response = await axios.get(NOMINATIM_URL, {
      params: {
        q: query,
        format: "json",
        limit: 1,
      },
      headers: {
        "User-Agent": "NSUT-Alumni-Network/1.0",
      },
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      const geocodedLat = parseFloat(result.lat);
      const geocodedLng = parseFloat(result.lon);

      return [geocodedLat, geocodedLng];
    }

    console.warn(`No geocoding results for: ${query}`);
    return null;
  } catch (error) {
    if (error.response && error.response.status === 429) {
      throw new Error("RATE_LIMIT");
    }
    console.error(`Geocoding error for ${city}, ${country}:`, error.message);
    console.error(`Full error:`, error);
    throw error;
  }
}

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Requeue items left in the in-progress list by a previously crashed worker.
// Idempotent — a duplicate geocode is harmless (it just re-sets lat/lng).
async function recoverInProgressItems() {
  try {
    const redis = getRedisClient();
    while ((await redis.lLen(IN_PROGRESS_KEY)) > 0) {
      const stuck = await redis.rPop(IN_PROGRESS_KEY);
      if (!stuck) break;
      await redis.lPush(QUEUE_KEY, stuck);
      console.warn(
        "[geocoding] Requeued in-progress item from previous run:",
        stuck,
      );
    }
  } catch (error) {
    console.error(
      "[geocoding] Failed to recover in-progress items:",
      error.message,
    );
  }
}

// Process one item from the queue
async function processNextItem() {
  let redis;
  let item = null;

  try {
    redis = getRedisClient();

    // Atomically claim an item so concurrent workers never process the same
    // one (lMove works across instances; lPop does not).
    item = await redis.lMove(QUEUE_KEY, IN_PROGRESS_KEY, "LEFT", "RIGHT");
    if (!item) {
      console.log("Geocoding queue is empty");
      stopProcessing();
      // Close the race where an item is enqueued between the empty lMove and
      // this worker stopping: isProcessing is already false here, so either we
      // detect the new item and restart, or a concurrent addToQueue starts a
      // fresh worker. Either way no item is stranded.
      try {
        if ((await redis.lLen(QUEUE_KEY)) > 0) {
          startProcessing();
        }
      } catch (err) {
        console.error(
          "[geocoding] Failed to re-check queue length:",
          err && err.message ? err.message : err,
        );
      }
      return;
    }

    const parsed = safeParse(item);
    if (!parsed) {
      // Corrupt item — drop it so it can't block the queue forever.
      console.error("[geocoding] Dropping corrupt queue item:", item);
      await redis.lRem(IN_PROGRESS_KEY, 1, item);
      await redis.del(PROCESSING_KEY);
      return;
    }

    const { userId, city, country } = parsed;
    console.log(`Processing geocoding for user ${userId}: ${city}, ${country}`);

    // Mark as processing (observability only; concurrency is handled by lMove)
    await redis.set(PROCESSING_KEY, userId, { EX: 60 });

    // Geocode the location
    const result = await geocodeLocation(city, country);

    if (result) {
      const [lat, lng] = result;
      // Update user profile with lat/lng
      await Profile.findOneAndUpdate(
        { user: userId },
        {
          "location.lat": lat,
          "location.lng": lng,
        },
      );
      console.log(`✓ Geocoded user ${userId}: lat=${lat}, lng=${lng}`);

      // Reset error count (rolling 1h window so it can't grow unbounded)
      await redis.set(ERROR_COUNT_KEY, 0, { EX: 3600 });

      // Invalidate alumni-map cache so the new pin shows up immediately
      await invalidateAlumniMapCache();
    } else {
      console.warn(`Failed to geocode location for user ${userId}`);
    }

    // Clear processing flag and remove item from the in-progress list
    await redis.del(PROCESSING_KEY);
    await redis.lRem(IN_PROGRESS_KEY, 1, item);
  } catch (error) {
    console.error("Error processing queue item:", error.message);

    // Release the claimed item from the in-progress list
    if (item) {
      try {
        await redis.lRem(IN_PROGRESS_KEY, 1, item);
      } catch (remErr) {
        console.error(
          "[geocoding] Failed to remove item from in-progress list:",
          remErr.message,
        );
      }
    }

    if (error.message === "RATE_LIMIT") {
      // Re-queue so the item is NOT lost — retried after the backoff window.
      // Rate-limit retries do not count toward MAX_RETRIES (backoff throttles
      // them instead).
      if (item) {
        const parsed = safeParse(item);
        if (parsed) {
          await redis.rPush(QUEUE_KEY, JSON.stringify(parsed));
          console.warn(
            `[geocoding] Re-queued item for user ${parsed.userId} after rate limit`,
          );
        }
      }
      await handleRateLimit(redis);
      await redis.del(PROCESSING_KEY);
      return;
    }

    // Non-rate-limit failure: retry up to MAX_RETRIES, then dead-letter so a
    // permanently failing item can't spin forever.
    if (item) {
      const parsed = safeParse(item);
      if (parsed) {
        parsed.retries = (parsed.retries || 0) + 1;
        if (parsed.retries <= MAX_RETRIES) {
          await redis.rPush(QUEUE_KEY, JSON.stringify(parsed));
          console.warn(
            `[geocoding] Re-queued item for user ${parsed.userId} after error (retry ${parsed.retries}/${MAX_RETRIES})`,
          );
        } else {
          console.error(
            `[geocoding] Dropping item for user ${parsed.userId} after ${MAX_RETRIES} failed attempts (${parsed.city}, ${parsed.country}). Manual intervention required.`,
          );
        }
      }
    }

    await redis.del(PROCESSING_KEY);
  }
}

// Handle rate limit error with exponential backoff
async function handleRateLimit(redis) {
  const errorCount = await redis.incr(ERROR_COUNT_KEY);
  // Rolling 1-hour window so a slow trickle of 429s can't accumulate forever
  await redis.expire(ERROR_COUNT_KEY, 3600);

  const delay = BACKOFF_DELAYS[errorCount] || BACKOFF_DELAYS[3];

  console.error(
    `⚠️ Rate limit hit! Error count: ${errorCount}. Pausing for ${delay / 1000}s`,
  );

  if (errorCount >= 3) {
    // Keep backing off at the max delay — never stop permanently. Log loudly
    // so humans can review Nominatim usage.
    console.error(
      "🛑 Multiple consecutive rate-limit errors. Processing paused with max backoff (1h). Verify Nominatim usage and consider a self-hosted geocoder.",
    );
    // TODO: Send alert to admins
  }

  // Stop processing and restart after delay (items are safe in the queue)
  stopProcessing();
  setTimeout(() => {
    console.log("Resuming geocoding queue processing after backoff period");
    startProcessing();
  }, delay);
}

// Start the queue processor
function startProcessing() {
  if (isProcessing) return;

  isProcessing = true;
  console.log("Started geocoding queue processor (1 req/sec)");

  // Recover items left in-progress by a crashed worker (idempotent)
  recoverInProgressItems();

  processingInterval = setInterval(async () => {
    try {
      await processNextItem();
    } catch (err) {
      // Defensive: never let a rejected promise escape the interval callback
      console.error(
        "[geocoding] Unhandled error in queue tick:",
        err && err.message ? err.message : err,
      );
    }
  }, RATE_LIMIT_MS);
}

// Stop the queue processor
function stopProcessing() {
  if (processingInterval) {
    clearInterval(processingInterval);
    processingInterval = null;
  }
  isProcessing = false;
  console.log("Stopped geocoding queue processor");
}

// Get current queue status
async function getQueueStatus() {
  try {
    const redis = getRedisClient();
    const queueLength = await redis.lLen(QUEUE_KEY);
    const inProgressLength = await redis.lLen(IN_PROGRESS_KEY);
    const errorCount = (await redis.get(ERROR_COUNT_KEY)) || 0;
    const currentlyProcessing = await redis.get(PROCESSING_KEY);

    return {
      queueLength,
      inProgressLength,
      errorCount: parseInt(errorCount),
      isProcessing,
      currentlyProcessing,
    };
  } catch (error) {
    console.error("Error getting queue status:", error);
    return null;
  }
}

module.exports = {
  addToQueue,
  startProcessing,
  stopProcessing,
  getQueueStatus,
  // Exported for tests / observability
  _internal: { QUEUE_KEY, IN_PROGRESS_KEY, ERROR_COUNT_KEY, MAX_RETRIES },
};

const axios = require("axios");
const { getRedisClient } = require("../config/redis.config");
const Profile = require("../models/user/profile.model");

const QUEUE_KEY = "geocoding:queue";
const PROCESSING_KEY = "geocoding:processing";
const ERROR_COUNT_KEY = "geocoding:error_count";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

// Rate limiting: 1 request per second
const RATE_LIMIT_MS = 1000;

// Exponential backoff delays
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

// Geocode a city/country using OpenStreetMap Nominatim API
async function geocodeLocation(city, country) {
  try {
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
      return [parseFloat(result.lat), parseFloat(result.lon)];
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

// Process one item from the queue
async function processNextItem() {
  const redis = getRedisClient();

  try {
    // Get next item from queue
    const item = await redis.lPop(QUEUE_KEY);
    if (!item) {
      console.log("Geocoding queue is empty");
      stopProcessing();
      return;
    }

    const { userId, city, country } = JSON.parse(item);
    console.log(`Processing geocoding for user ${userId}: ${city}, ${country}`);

    // Mark as processing
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

      // Invalidate alumni-map cache
      try {
        await redis.del("alumni-map:locations");
      } catch (cacheErr) {
        console.error("Failed to invalidate alumni-map cache in geocoding worker:", cacheErr);
      }

      // Reset error count on success
      await redis.set(ERROR_COUNT_KEY, 0);
    } else {
      console.warn(`Failed to geocode location for user ${userId}`);
    }

    // Clear processing flag
    await redis.del(PROCESSING_KEY);
  } catch (error) {
    console.error("Error processing queue item:", error.message);

    if (error.message === "RATE_LIMIT") {
      await handleRateLimit(redis);
    }

    await redis.del(PROCESSING_KEY);
  }
}

// Handle rate limit error with exponential backoff
async function handleRateLimit(redis) {
  const errorCount = await redis.incr(ERROR_COUNT_KEY);
  const delay = BACKOFF_DELAYS[errorCount] || BACKOFF_DELAYS[3];

  console.error(
    `⚠️ Rate limit hit! Error count: ${errorCount}. Pausing for ${delay / 1000}s`,
  );

  if (errorCount >= 3) {
    console.error(
      "🛑 Maximum retries reached. Stopping queue processor. Manual intervention required.",
    );
    stopProcessing();
    // TODO: Send alert to admins
    return;
  }

  // Stop processing and restart after delay
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

  processingInterval = setInterval(async () => {
    await processNextItem();
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
    const errorCount = (await redis.get(ERROR_COUNT_KEY)) || 0;
    const currentlyProcessing = await redis.get(PROCESSING_KEY);

    return {
      queueLength,
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
};

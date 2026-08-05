const { getRedisClient } = require("./redis.config");

// Centralized Redis cache keys. Keeping them in one module prevents typos from
// silently breaking cache invalidation across the codebase.
const ALUMNI_MAP_LOCATIONS_KEY = "alumni-map:locations";

// Best-effort invalidation of the alumni map cache. Never throws — Redis
// unavailability should not fail a request that already succeeded in the DB.
async function invalidateAlumniMapCache() {
  try {
    const redis = getRedisClient();
    await redis.del(ALUMNI_MAP_LOCATIONS_KEY);
  } catch (err) {
    console.warn(
      "[cache] Failed to invalidate alumni-map cache:",
      err && err.message ? err.message : err
    );
  }
}

module.exports = {
  ALUMNI_MAP_LOCATIONS_KEY,
  invalidateAlumniMapCache,
};

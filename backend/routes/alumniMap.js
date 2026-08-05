const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const Profile = require("../models/user/profile.model");
const { ALUMNI_MAP_LOCATIONS_KEY } = require("../config/cacheKeys");

// 60 requests per 15 minutes per IP
const mapRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

// GET /api/alumni-map - Return alumni locations for map visualization
router.get("/", mapRateLimiter, async (req, res) => {
  try {
    // Try to serve from Redis cache if available
    try {
      const { getRedisClient } = require("../config/redis.config");
      const redis = getRedisClient();
      if (redis) {
        const cachedData = await redis.get(ALUMNI_MAP_LOCATIONS_KEY);
        if (cachedData) {
          return res.status(200).json({ locations: JSON.parse(cachedData) });
        }
      }
    } catch (cacheErr) {
      // Non-blocking catch if Redis is unavailable or unconfigured
      console.warn(
        "[alumni-map] Redis unavailable, serving from DB:",
        cacheErr && cacheErr.message ? cacheErr.message : cacheErr,
      );
    }

    // Find all profiles with valid location coordinates
    const locations = await Profile.aggregate([
      {
        $match: {
          // Only numeric coordinates — legacy string/garbage values would
          // otherwise flow through and produce NaN markers on the frontend.
          "location.lat": { $exists: true, $ne: null, $type: ["double", "int"] },
          "location.lng": { $exists: true, $ne: null, $type: ["double", "int"] },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $match: {
          "userInfo.role": "alumni",
          "userInfo.banned": { $ne: true },
          "userInfo.verified_alumni": true,
        },
      },
      {
        // Deterministic ordering so $first picks the same lat/lng every time
        // (cached vs. freshly-computed responses can't disagree).
        $sort: { "location.lat": 1, "location.lng": 1 },
      },
      {
        $group: {
          _id: {
            city: { $toLower: { $trim: { input: { $ifNull: ["$location.city", "unknown"] } } } },
            country: { $toLower: { $trim: { input: { $ifNull: ["$location.country", "unknown"] } } } },
          },
          count: { $sum: 1 },
          lat: { $first: "$location.lat" },
          lng: { $first: "$location.lng" },
          rawCity: { $first: "$location.city" },
          rawCountry: { $first: "$location.country" },
        },
      },
      {
        $project: {
          _id: 0,
          // Replace missing OR blank city/country with a readable label so
          // popups never render empty lines.
          city: {
            $cond: [
              { $eq: [{ $trim: { input: { $ifNull: ["$rawCity", ""] } } }, ""] },
              "Unknown",
              "$rawCity",
            ],
          },
          country: {
            $cond: [
              { $eq: [{ $trim: { input: { $ifNull: ["$rawCountry", ""] } } }, ""] },
              "Unknown",
              "$rawCountry",
            ],
          },
          count: 1,
          lat: 1,
          lng: 1,
        },
      },
    ]);

    // Store in Redis cache if available (TTL: 1 hour / 3600 seconds)
    try {
      const { getRedisClient } = require("../config/redis.config");
      const redis = getRedisClient();
      if (redis) {
        await redis.set(ALUMNI_MAP_LOCATIONS_KEY, JSON.stringify(locations), { EX: 3600 });
      }
    } catch (cacheErr) {
      // Non-blocking catch if Redis fails
      console.warn(
        "[alumni-map] Failed to write cache:",
        cacheErr && cacheErr.message ? cacheErr.message : cacheErr,
      );
    }

    res.status(200).json({ locations });
  } catch (error) {
    console.error("Error fetching alumni map data:", error);
    res.status(500).json({ error: "Failed to load alumni map data" });
  }
});

module.exports = router;

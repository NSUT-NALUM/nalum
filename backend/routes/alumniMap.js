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

    const { normalizeCityAndCountry, CANONICAL_CITIES } = require("../config/canonicalCities");

    // Find all profiles with valid location coordinates
    const rawLocations = await Profile.aggregate([
      {
        $match: {
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
        $group: {
          _id: {
            city: { $toLower: { $trim: { input: { $ifNull: ["$location.city", "unknown"] } } } },
            country: { $toLower: { $trim: { input: { $ifNull: ["$location.country", "unknown"] } } } },
          },
          count: { $sum: 1 },
          avgLat: { $avg: "$location.lat" },
          avgLng: { $avg: "$location.lng" },
          rawCity: { $first: "$location.city" },
          rawCountry: { $first: "$location.country" },
        },
      },
    ]);

    // Post-process with canonical resolution and alias merging (e.g. delhi/new delhi -> New Delhi, bangalore/bengaluru -> Bengaluru)
    const groupedMap = new Map();

    for (const item of rawLocations) {
      const { normalizedCity, normalizedCountry, canonicalKey, displayCity, displayCountry } =
        normalizeCityAndCountry(item._id.city, item._id.country);

      if (!groupedMap.has(canonicalKey)) {
        const canonical = CANONICAL_CITIES[canonicalKey];
        groupedMap.set(canonicalKey, {
          city: displayCity,
          country: displayCountry,
          count: 0,
          latSum: 0,
          lngSum: 0,
          rawCount: 0,
          canonicalLat: canonical ? canonical.lat : null,
          canonicalLng: canonical ? canonical.lng : null,
        });
      }

      const record = groupedMap.get(canonicalKey);
      record.count += item.count;
      record.latSum += item.avgLat * item.count;
      record.lngSum += item.avgLng * item.count;
      record.rawCount += item.count;
    }

    const locations = Array.from(groupedMap.values()).map((record) => {
      // Use canonical coordinates if available; otherwise use weighted average
      const finalLat = record.canonicalLat !== null
        ? record.canonicalLat
        : (record.rawCount > 0 ? record.latSum / record.rawCount : 0);
      const finalLng = record.canonicalLng !== null
        ? record.canonicalLng
        : (record.rawCount > 0 ? record.lngSum / record.rawCount : 0);

      return {
        city: record.city,
        country: record.country,
        count: record.count,
        lat: Number(finalLat.toFixed(6)),
        lng: Number(finalLng.toFixed(6)),
      };
    });

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

const express = require("express");
const router = express.Router();
const axios = require("axios");
const rateLimit = require("express-rate-limit");
const { protect } = require("../middleware/auth");

const NOMINATIM_URL = "https://nominatim.openstreetmap.org";

// Authenticated users still must not hammer the public Nominatim service
// through this proxy (OSMF usage policy: ~1 req/sec aggregate per app).
const geocodeRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

// Reject null/undefined/empty — Number(null) === 0 and Number("") === 0 would
// otherwise let null/empty values slip through as a (0, 0) coordinate.
const isFiniteCoordinate = (value) =>
  value !== null &&
  value !== undefined &&
  value !== "" &&
  Number.isFinite(Number(value));

// POST /api/geocode/reverse - Reverse geocode coordinates to city/country
router.post("/reverse", protect, geocodeRateLimiter, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (!isFiniteCoordinate(lat) || !isFiniteCoordinate(lng)) {
      return res
        .status(400)
        .json({ error: "Valid latitude and longitude are required" });
    }

    const response = await axios.get(`${NOMINATIM_URL}/reverse`, {
      params: { lat: Number(lat), lon: Number(lng), format: "json" },
      headers: { "User-Agent": "NSUT-Alumni-Network/1.0" },
    });

    const data = response.data || {};
    const address = data.address || {};
    const city = address.city || address.town || address.village || "";
    const country = address.country || "";

    res.status(200).json({ city, country });
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    res.status(500).json({ error: "Failed to reverse geocode location" });
  }
});

// POST /api/geocode/search - Forward geocode city/country to lat/lng
router.post("/search", protect, geocodeRateLimiter, async (req, res) => {
  try {
    const { city, country } = req.body;
    if (
      !city ||
      !country ||
      typeof city !== "string" ||
      typeof country !== "string"
    ) {
      return res.status(400).json({ error: "City and country are required" });
    }

    const response = await axios.get(`${NOMINATIM_URL}/search`, {
      params: { q: `${city}, ${country}`, format: "json", limit: 1 },
      headers: { "User-Agent": "NSUT-Alumni-Network/1.0" },
    });

    const result =
      response.data && response.data.length > 0 ? response.data[0] : null;

    res.status(200).json({
      lat: result ? Number(result.lat) : null,
      lng: result ? Number(result.lon) : null,
    });
  } catch (error) {
    console.error("Forward geocoding error:", error);
    res.status(500).json({ error: "Failed to geocode location" });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getQueueStatus } = require("../services/geocodingQueue");

// GET /api/geocode/status - Get current status of the global geocoding queue
router.get("/status", protect, async (req, res) => {
  try {
    const status = await getQueueStatus();
    res.status(200).json({ success: true, status });
  } catch (error) {
    console.error("Geocoding queue status error:", error);
    res.status(500).json({ error: "Failed to fetch queue status" });
  }
});

module.exports = router;

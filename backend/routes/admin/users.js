const express = require("express");
const router = express.Router();
const banController = require("../../controllers/admin/ban.controller");
const { protectAdmin } = require("../../middleware/adminAuth");

// All routes are protected (admin only)
router.post("/ban/:userId", protectAdmin, banController.banUser);
router.post("/unban/:userId", protectAdmin, banController.unbanUser);
router.get("/banned", protectAdmin, banController.getBannedUsers);
router.get("/history/:userId", protectAdmin, banController.getUserBanHistory);
router.delete("/:userId", protectAdmin, banController.deactivateUser); // Task 3.6

module.exports = router;

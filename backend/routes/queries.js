const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { protectAdmin } = require('../middleware/adminAuth');
const { checkBanned } = require('../middleware/checkBanned');
const uploadQueryImage = require('../config/queryImage.multer');
const {
  createQuery,
  getMyQueries,
  getAllQueries,
  updateQueryStatus,
  respondToQuery,
  deleteQuery,
} = require('../controllers/query.controller');

// User routes (Students & Alumni)
router.post( "/", protect, checkBanned, uploadQueryImage.array("images", 2), createQuery );
router.get("/my", protect, getMyQueries);
router.delete("/:id", protect, deleteQuery);

// Admin routes
router.get("/all", protectAdmin, getAllQueries);
router.put("/:id/viewed", protectAdmin, updateQueryStatus);
router.put("/:id/respond", protectAdmin, respondToQuery);

module.exports = router;

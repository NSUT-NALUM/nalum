const express = require("express");
const router = express.Router();
const users = require("../../controllers/user.controller.js");

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// POST /api/auth/check-email
// Tells the client whether an account already exists for this email,
// so the UI can nudge the user toward sign in or sign up.
router.post("/", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: true, code: 400, message: "Email is required" });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ error: true, code: 400, message: "Please provide a valid email address" });
  }

  const result = await users.findOne(email);

  if (result.error) {
    return res.status(500).json({ error: true, code: 500, message: result.message || "Internal server error" });
  }

  const exists = !!result.data;

  return res.status(200).json({
    error: false,
    code: 200,
    exists,
    message: exists
      ? "An account with this email already exists. Please sign in."
      : "No account found with this email. Please sign up.",
  });
});

module.exports = router;
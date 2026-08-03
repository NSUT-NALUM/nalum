const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const users = require("../../controllers/user.controller.js");
const { JWT_SECRET } = require("../../config/jwt.config.js");
const { validatePassword } = require("../../utils/passwordPolicy");

router.post("/", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({
      error: true,
      message: "Token and password are required",
    });
  }

  // Verify and decode JWT
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(400).json({ error: true, message: "Reset link has expired, request a new one." });
    }
    return res.status(400).json({ error: true, message: "Invalid or expired token" });
  }
  
  const { email } = decoded;
  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({
      error: true,
      message: passwordError,
    });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Update user password
  const userResponse = await users.update(email, { password: hashedPassword });
  if (userResponse.error) {
    return res.status(500).json(userResponse);
  }

  return res.json({ error: false, message: "Password reset successfully" });
});

module.exports = router;

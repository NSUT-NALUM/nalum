const express = require("express");
const router = express.Router();
const users = require("../../controllers/user.controller.js");
const mailService = require("../../mail/mailService.js");
const verificationToken = require("../../controllers/verificationToken.controller.js");

router.post("/", async (req, res) => {
  try {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: true, message: "Email is required" });
  }

  // Validate email format
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: true, message: "Invalid email format" });
  }

  // Sanitize email
  const sanitizedEmail = email.toLowerCase().trim();

  const data = await users.findOne(sanitizedEmail);

  // Always return 200 to prevent email enumeration
  if (data.error || !data.data) {
    if (process.env.DEBUG_MAIL === "true") {
      console.log(`[DEBUG] User not found for email: ${sanitizedEmail} - Email not sent`);
    }
    return res.json({
      error: false,
      message: "If this email exists, a reset link has been sent.",
    });
  }

  // Generate a single-use password reset token (expires in 5 minutes)
  const tokenResponse = await verificationToken.create(
    sanitizedEmail,
    "password_reset",
    1000 * 60 * 5
  );

  if (tokenResponse.error) {
    throw new Error(tokenResponse.message);
  }

  const token = tokenResponse.data.token;
  const frontendUrl = process.env.FRONTEND_URL || "https://alumni.nsut.ac.in";
  const resetLink = `${frontendUrl}/reset-password?email=${encodeURIComponent(sanitizedEmail)}&token=${token}`;

  // Log password reset link for testing (always log when DEBUG_MAIL is enabled)
  const shouldLogLink = process.env.NODE_ENV === "development" || process.env.DEBUG_MAIL === "true";
  if (shouldLogLink) {
    console.log("\n========== PASSWORD RESET LINK ==========");
    console.log(`Email: ${sanitizedEmail}`);
    console.log(`Token: ${token}`);
    console.log(`Link: ${resetLink}`);
    console.log(`Expires: 5 minutes`);
    console.log("=========================================\n");
  }

  // Skip sending email in debug mode to save email quota
  if (shouldLogLink) {
    console.log(`[DEBUG] Email sending SKIPPED for ${sanitizedEmail} (DEBUG_MAIL=true)`);;
    return res.json({
      error: false,
      message: "If this email exists, a reset link has been sent.",
    });
  }

  await mailService.send({
    to: sanitizedEmail,
    subject: "Reset Your Password - NSUT AlumniNet",
    template: "password-reset",
    data: { resetLink },
  });

  return res.json({
    error: false,
    message: "If this email exists, a reset link has been sent.",
  });
  } 
  catch (error) {
    console.error("[forgetPassword] Error:", error?.message ?? error ?? "Unknown error");
    // Don't expose internal errors to client  
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
});

module.exports = router;

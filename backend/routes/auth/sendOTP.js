const express = require("express");
const router = express.Router();
const otpController = require("../../controllers/otp.controller.js");
const mailService = require("../../mail/mailService.js");
const user = require("../../controllers/user.controller.js");
router.post("/", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: true,
      code: 400,
      message: "Email is required",
    });
  }
  const otpData = await otpController.create(email);
  if (otpData.error) {
    return res.status(500).json({
      error: true,
      code: 500,
      message: otpData.message || "Internal server error",
    });
  }
  if (process.env.NODE_ENV === 'development') {
    console.log(`OTP for ${email}: ${otpData.data.otp}`);
    return res.status(200).json({
      error: false,
      message: 'OTP sent successfully (logged to console in development)',
      code: 200,
    });
  }
  return mailService
    .send({
      to: email,
      subject: "Your Alumni Portal Access Code",
      template: "otp",
      data: { otp: otpData.data.otp },
    })
    .then((mailResponse) => {
      if (mailResponse.error) {
        return res.status(500).json({
          error: true,
          code: 500,
          message:
            "We encountered an issue sending your verification email. Please try again.",
        });
      }
      return res.status(200).json({
        error: false,
        message: "Verification code sent successfully to your registered email",
        code: 200,
      });
    })
    .catch((err) => {
      return res.status(500).json({
        error: true,
        code: 500,
        message: "Unable to send verification email. Please try again later.",
      });
    });
});

module.exports = router;

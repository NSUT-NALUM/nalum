const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: process.env.BREVO_SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

/**
 * Send notification email
 */
async function sendEmail({ to, subject, template, data }) {
  try {
    // Read template
    const templatePath = path.join(__dirname, 'templates', `${template}.html`);
    let html = await fs.readFile(templatePath, 'utf-8');

    // Simple template replacement
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, data[key] || '');
    });

    // Handle conditionals (simple {{#if}} implementation)
    html = html.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (match, key, content) => {
      return data[key] ? content : '';
    });

    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_EMAIL}>`,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Notification email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending notification email:', error);
    return false;
  }
}

module.exports = { sendEmail };

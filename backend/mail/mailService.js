const fs = require('fs').promises;
const path = require('path');
const mailConfig = require('../config/mail.config');

const TEMPLATES_DIR = path.join(__dirname, 'templates');

/**
 * Compile an HTML template string with the given data.
 *
 * Supported syntax:
 *   {{key}}           – replaced with data[key] (or empty string if missing)
 *   {{#if key}} … {{/if}}  – block kept only when data[key] is truthy
 *
 * @param {string} html  Raw template string
 * @param {Object} data  Key-value pairs to inject
 * @returns {string}     Compiled HTML
 */
function compileTemplate(html, data = {}) {
  // Handle {{#if key}} … {{/if}} conditionals
  let compiled = html.replace(
    /\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_match, key, content) => (data[key] ? content : ''),
  );

  // Replace {{key}} placeholders
  compiled = compiled.replace(
    /\{\{(\w+)\}\}/g,
    (_match, key) => (data[key] != null ? String(data[key]) : ''),
  );

  return compiled;
}

/**
 * Load and compile an HTML template from the templates directory.
 *
 * @param {string} templateName  Filename without extension (e.g. "verification")
 * @param {Object} data          Template variables
 * @returns {Promise<string>}    Compiled HTML
 */
async function loadTemplate(templateName, data = {}) {
  const filePath = path.join(TEMPLATES_DIR, `${templateName}.html`);
  const raw = await fs.readFile(filePath, 'utf-8');
  return compileTemplate(raw, data);
}

/**
 * Generate a plain-text fallback from HTML by stripping tags and collapsing whitespace.
 *
 * @param {string} html
 * @returns {string}
 */
function htmlToPlainText(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&copy;/gi, '©')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Send an email via Brevo REST API.
 *
 * Usage patterns:
 *
 *   // 1. With a named template  (recommended for most cases)
 *   await mailService.send({
 *     to: 'user@example.com',
 *     subject: 'Verify your account',
 *     template: 'verification',
 *     data: { name: 'John', verificationLink: '...' },
 *   });
 *
 *   // 2. With raw HTML  (for one-off or dynamically built emails)
 *   await mailService.send({
 *     to: 'user@example.com',
 *     subject: 'Hello',
 *     html: '<h1>Hi there</h1>',
 *   });
 *
 *   // 3. With raw text only
 *   await mailService.send({
 *     to: 'user@example.com',
 *     subject: 'Plain message',
 *     text: 'Hello, world!',
 *   });
 *
 * @param {Object}  options
 * @param {string}  options.to        Recipient email address
 * @param {string}  options.subject   Email subject line
 * @param {string} [options.template] Template name (file in templates/ without .html)
 * @param {Object} [options.data]     Variables to inject into the template
 * @param {string} [options.html]     Raw HTML (used when template is not provided)
 * @param {string} [options.text]     Raw plain text (auto-generated from HTML if omitted)
 * @returns {Promise<{error: boolean, messageId?: string, message?: string}>}
 */
async function send({ to, subject, template, data = {}, html, text }) {
  try {
    // Build HTML content
    let htmlContent = html || '';
    if (template) {
      htmlContent = await loadTemplate(template, data);
    }

    // Build plain text fallback
    const textContent = text || htmlToPlainText(htmlContent);

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': mailConfig.SMTP_PASS,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: mailConfig.FROM_NAME,
          email: mailConfig.FROM_EMAIL,
        },
        to: [{ email: to }],
        subject,
        htmlContent,
        textContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Brevo API error:', errorData);
      throw new Error(
        `Brevo API error: ${response.status} - ${JSON.stringify(errorData)}`,
      );
    }

    const result = await response.json();
    console.log('Email sent successfully:', result.messageId);
    return { error: false, messageId: result.messageId };
  } catch (error) {
    console.error('Mailer error:', error);
    return { error: true, message: error.message };
  }
}

module.exports = { send, compileTemplate, loadTemplate, htmlToPlainText };

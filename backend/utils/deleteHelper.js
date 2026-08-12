const fs = require("fs");
const path = require("path");

/**
 * Safely removes a single file from the filesystem.
 * Silent on missing files — never throws.
 *
 * @param {string} relativePath - Path relative to `uploadsRoot` (e.g. "posts/image.jpg")
 * @param {string} [uploadsRoot="../uploads"] - Root path relative to this file's __dirname
 */
function cleanupFile(relativePath, uploadsRoot = "../uploads") {
  if (!relativePath) return;
  const abs = path.join(__dirname, uploadsRoot, relativePath);
  if (fs.existsSync(abs)) {
    try {
      fs.unlinkSync(abs);
    } catch (e) {
      console.error(`[deleteHelper] Failed to delete file "${abs}":`, e.message);
    }
  }
}

/**
 * Batch cleanup for an array of filenames inside a specific upload subfolder.
 *
 * @param {string[]} filenames - Array of bare filenames (e.g. ["img1.jpg", "img2.png"])
 * @param {string} subfolder   - Subfolder under uploads (e.g. "posts", "givings")
 * @param {string} [uploadsRoot="../uploads"]
 */
function cleanupFiles(filenames = [], subfolder = "", uploadsRoot = "../uploads") {
  filenames.forEach((filename) => {
    if (!filename) return;
    const rel = subfolder ? `${subfolder}/${filename}` : filename;
    cleanupFile(rel, uploadsRoot);
  });
}

/**
 * Creates a standardised HTTP error with a `statusCode` property.
 * Centralised version of the pattern already in commentService.js.
 *
 * @param {string} message
 * @param {number} [statusCode=400]
 * @returns {Error}
 */
function createHttpError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

/**
 * Asserts that the requesting user is either the resource owner or a site admin.
 * Throws a 403 HttpError if neither condition is met.
 *
 * @param {object} opts
 * @param {string|object} opts.ownerId       - The resource's owner ID (ObjectId or string)
 * @param {string}        opts.requestUserId - ID of the user making the request
 * @param {string}        opts.userRole      - Role of the requesting user ("admin", "alumni", "student")
 */
function getEntityId(idOrObj) {
  if (!idOrObj) return "";
  if (typeof idOrObj === "string") return idOrObj;
  if (idOrObj._id) return idOrObj._id.toString();
  return idOrObj.toString();
}

function assertDeletePermission({ ownerId, requestUserId, userRole }) {
  const ownerStr = getEntityId(ownerId);
  const reqUserStr = getEntityId(requestUserId);
  const isOwner = Boolean(ownerStr && reqUserStr && ownerStr === reqUserStr);
  const isAdmin = userRole === "admin";

  if (!isOwner && !isAdmin) {
    throw createHttpError(
      "You are not authorized to delete this resource",
      403
    );
  }
}

module.exports = {
  cleanupFile,
  cleanupFiles,
  createHttpError,
  assertDeletePermission,
};

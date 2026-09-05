const { cleanupFiles, cleanupFile } = require("./deleteHelper");

/**
 * Full cascade when a Post is deleted.
 *
 * 1. Hard-deletes all child Comment documents for the post.
 *    (Comments have no value without their parent post — no tombstone needed)
 * 2. Cleans up all associated image files from disk.
 *
 * @param {object} post - Mongoose Post document (must have ._id and .images)
 */
async function cascadeDeletePost(post) {
  // Lazy-require to avoid circular dependency issues at module load time
  const Comment = require("../models/posts/comment.model");
  const Notification = require("../models/notification.model");

  // 1. Remove all child comments
  await Comment.deleteMany({ postId: post._id });

  // 2. Remove notifications associated with this post
  if (Notification) {
    await Notification.deleteMany({
      "relatedEntity.entityType": "post",
      "relatedEntity.entityId": post._id.toString(),
    });
  }

  // 3. Remove image files from uploads/posts/
  if (post.images && post.images.length > 0) {
    cleanupFiles(post.images, "posts");
  }
}

/**
 * Full cascade when a User account is deactivated/deleted.
 *
 * Soft-deletes all content owned by the user across every entity.
 * Messages are intentionally left intact — they belong to conversations,
 * not the individual user, and removing them would corrupt others' history.
 *
 * Cascade order matters — later steps depend on fields added by earlier ones.
 *
 * @param {string|object} userId - The user's MongoDB ObjectId or string
 */
async function cascadeDeleteUser(userId) {
  // Lazy-requires to avoid circular dependency issues
  const Post = require("../models/posts/post.model");
  const Comment = require("../models/posts/comment.model");
  const Event = require("../models/admin/event.model");
  const Giving = require("../models/giving.model");
  const Query = require("../models/query.model");
  const Profile = require("../models/user/profile.model");

  const now = new Date();

  // 1. Soft-delete all posts
  await Post.updateMany(
    { userId, isDeleted: { $ne: true } },
    { $set: { isDeleted: true, deletedAt: now } }
  );

  // 2. Tombstone all active comments
  await Comment.updateMany(
    { authorId: userId, status: "active" },
    { $set: { status: "deleted", deletedAt: now } }
  );

  // 3. Soft-delete all events (is_active flag — existing pattern)
  await Event.updateMany(
    { created_by: userId, is_active: true },
    { $set: { is_active: false } }
  );

  // 4. Soft-delete all givings
  await Giving.updateMany(
    { userId, isDeleted: { $ne: true } },
    { $set: { isDeleted: true, deletedAt: now } }
  );

  // 5. Soft-delete all queries
  await Query.updateMany(
    { userId, isDeleted: { $ne: true } },
    { $set: { isDeleted: true, deletedAt: now } }
  );

  // 6. Remove profile picture file from disk
  const profile = await Profile.findOne({ user: userId }).lean();
  if (profile && profile.profile_picture) {
    // profile_picture may be stored as a filename or a full path like /uploads/...
    cleanupFile(profile.profile_picture, "..");
  }

  // Note: session/token invalidation is handled at the route layer
  // (refresh tokens are cleared when the account deactivation endpoint is called)
}

module.exports = { cascadeDeletePost, cascadeDeleteUser };

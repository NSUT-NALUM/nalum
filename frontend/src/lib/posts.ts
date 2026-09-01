import { BASE_URL } from "@/lib/constants";

// The author shape every posts endpoint returns. `batch`/`current_role` and
// friends are stitched on from the Profile collection by the API, so they are
// present on lists but may be null for users who never filled a profile in.
export interface PostAuthor {
  _id: string;
  name: string;
  email?: string;
  role?: string;
  profile_picture?: string | null;
  batch?: string | null;
  branch?: string | null;
  current_role?: string | null;
  current_company?: string | null;
  bio?: string | null;
}

export type PostStatus = "pending" | "approved" | "rejected";

export interface PostRecord {
  _id: string;
  title: string;
  content: string;
  tags?: string[];
  images?: string[];
  userId: PostAuthor;
  status?: PostStatus;
  rejection_reason?: string | null;
  commentCount?: number;
  createdAt: string;
  updatedAt: string;
  /** Server returns an array of user ids; older documents may hold a count. */
  likes?: string[] | number;
  liked_by?: string[];
}

export const getPostImageUrl = (image: string) =>
  image.startsWith("http") ? image : `${BASE_URL}/uploads/posts/${image}`;

// Likes have been stored two ways over the life of this collection; everything
// downstream wants the id array.
export const likeIds = (post: Pick<PostRecord, "likes" | "liked_by">): string[] => {
  if (Array.isArray(post.likes)) return post.likes;
  if (Array.isArray(post.liked_by)) return post.liked_by;
  return [];
};

// Posts created before the editor had a headline field repeat their title as
// the first line of the body. Drop it so the article doesn't say it twice.
export const bodyWithoutTitle = (content: string, title: string) => {
  const [firstLine, ...rest] = content.split("\n");
  if (firstLine.trim() && firstLine.trim() === title.trim()) {
    return rest.join("\n").replace(/^\n+/, "");
  }
  return content;
};

// Strips the markdown scaffolding so a body can be used as a plain-text
// preview line or fed to a word count.
export const toPlainText = (markdown: string) =>
  markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/^[>#\-*+\s]+/gm, " ")
    .replace(/[*_~`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export const wordCount = (markdown: string) => {
  const text = toPlainText(markdown);
  return text ? text.split(" ").length : 0;
};

// 200 wpm is the usual reading-speed assumption for prose of this kind.
export const readingTime = (markdown: string) =>
  Math.max(1, Math.round(wordCount(markdown) / 200));

export const authorHeadline = (author: PostAuthor) => {
  const role = [author.current_role, author.current_company]
    .filter(Boolean)
    .join(" at ");
  return role || (author.role === "admin" ? "Administrator" : "Alumni");
};

export const STATUS_LABELS: Record<PostStatus, string> = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
};

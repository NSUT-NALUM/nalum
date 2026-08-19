import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Info, MessageSquare, Share2, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import UserAvatar from "@/components/UserAvatar";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  CARD_HOVER,
  CARD_TAP,
  SPRING,
  SPRING_POP,
  blockEntrance,
} from "@/lib/motion";
import { PostRecord, getPostImageUrl, likeIds, toPlainText } from "@/lib/posts";
import { cn } from "@/lib/utils";

interface PostRowProps {
  post: PostRecord;
  onTagClick?: (tag: string) => void;
  /** Position in the list — staggers this row's entrance behind the one above. */
  index?: number;
}

// One row in the community feed. The whole card opens the discussion; the
// action bar at the foot stops propagation so it can be used in place.
export const PostRow = ({ post, onTagClick, index = 0 }: PostRowProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [likes, setLikes] = useState<string[]>(likeIds(post));
  const [pending, setPending] = useState(false);
  const [showAdminQueryMessage, setShowAdminQueryMessage] = useState(false);

  const isAdminPost = post.userId?.role === "admin";
  const liked = !!user?.id && likes.includes(user.id);
  const excerpt = toPlainText(post.content);
  const comments = post.commentCount ?? 0;
  const coverImage =
    post.images && post.images.length > 0 ? post.images[0] : null;

  const toggleLike = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (pending || !user?.id) return;

    const previous = likes;
    setPending(true);
    setLikes(liked ? likes.filter((id) => id !== user.id) : [...likes, user.id]);

    try {
      const { data } = await api.post(`/posts/${post._id}/like`);
      if (data.success && Array.isArray(data.likes)) setLikes(data.likes);
    } catch (error) {
      console.error("Error liking post:", error);
      setLikes(previous);
    } finally {
      setPending(false);
    }
  };

  const share = async (event: React.MouseEvent) => {
    event.stopPropagation();
    const url = `${window.location.origin}/dashboard/posts/${post._id}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, text: excerpt.slice(0, 120), url });
        return;
      } catch {
        return; // sheet dismissed
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy the link");
    }
  };

  const openPost = () => navigate(`/dashboard/posts/${post._id}`);

  return (
    // The entrance carries its own transition, which leaves the `transition`
    // prop free to govern the hover lift and the press.
    <motion.article
      role="link"
      tabIndex={0}
      {...blockEntrance(index)}
      whileHover={CARD_HOVER}
      whileTap={CARD_TAP}
      transition={SPRING}
      onClick={openPost}
      onKeyDown={(event) => event.key === "Enter" && openPost()}
      className="cursor-pointer rounded-card border border-border bg-card p-5 shadow-card transition-colors hover:border-primary/25 sm:p-6"
    >
      {/* Byline */}
      <div
        role="button"
        tabIndex={0}
        onClick={(event) => {
          event.stopPropagation();
          if (isAdminPost) {
            setShowAdminQueryMessage((prev) => !prev);
          } else if (post.userId?._id) {
            navigate(`/dashboard/alumni/${post.userId._id}`);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.stopPropagation();
            if (isAdminPost) {
              setShowAdminQueryMessage((prev) => !prev);
            } else if (post.userId?._id) {
              navigate(`/dashboard/alumni/${post.userId._id}`);
            }
          }
        }}
        className="group/author flex w-fit items-center gap-3 cursor-pointer"
      >
        <UserAvatar
          src={post.userId?.profile_picture || undefined}
          name={post.userId?.name ?? "Unknown user"}
          size="md"
        />
        <div className="min-w-0">
          <p className="truncate text-label-md text-foreground group-hover/author:text-primary transition-colors">
            {post.userId?.name ?? "Unknown user"}
          </p>
          <p className="flex flex-wrap items-center gap-x-2 text-body-sm text-muted-foreground">
            {post.userId?.batch && <span>Class of {post.userId.batch}</span>}
            {post.userId?.batch && <span aria-hidden="true">•</span>}
            <span>
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
          </p>
        </div>
      </div>

      {/* Admin Query Message if toggled */}
      {isAdminPost && showAdminQueryMessage && (
        <div
          className="mt-3 flex flex-col gap-2 rounded-lg border border-warning/40 bg-warning-subtle p-3 text-body-sm text-foreground sm:flex-row sm:items-center sm:justify-between"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0 text-warning" />
            <span>Got any queries for the admin? Use the Queries page.</span>
          </div>
          <Link
            to="/dashboard/queries"
            onClick={(event) => event.stopPropagation()}
            className="inline-flex shrink-0 items-center gap-1 text-label-sm font-semibold text-primary hover:underline"
          >
            Ask a Query →
          </Link>
        </div>
      )}

      <h3 className="mt-4 line-clamp-2 break-words text-headline-md text-foreground">
        {post.title}
      </h3>

      {excerpt && (
        <p className="mt-1.5 line-clamp-2 whitespace-pre-line text-body-md text-muted-foreground">
          {excerpt}
        </p>
      )}

      {/* Render Cover Image Preview */}
      {coverImage && (
        <div className="mt-3 overflow-hidden rounded-lg border border-border max-w-md">
          <img
            src={getPostImageUrl(coverImage)}
            alt={post.title}
            className="max-h-60 w-full object-cover"
          />
        </div>
      )}

      {(post.tags || []).length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags!.map((tag) => (
            <motion.button
              key={tag}
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.94 }}
              transition={SPRING}
              onClick={(event) => {
                event.stopPropagation();
                onTagClick?.(tag);
              }}
              className="ap-chip transition-colors hover:bg-primary-subtle hover:text-primary-subtle-foreground"
            >
              {tag}
            </motion.button>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-1 border-t border-border pt-3">
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          transition={SPRING}
          onClick={toggleLike}
          aria-pressed={liked}
          aria-label={liked ? "Remove upvote" : "Upvote post"}
          className={cn(
            "flex items-center gap-2 rounded-full px-3 py-2 text-label-md transition-colors",
            liked
              ? "bg-primary-subtle text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-primary"
          )}
        >
          {/* Keyed on `liked` so the icon re-mounts and springs each time the
              vote flips — the only confirmation the optimistic update gets. */}
          <motion.span
            key={String(liked)}
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            transition={SPRING_POP}
            className="flex"
          >
            <ThumbsUp className={cn("h-4 w-4", liked && "fill-current")} />
          </motion.span>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={likes.length}
              initial={{ opacity: 0, y: liked ? 6 : -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: liked ? -6 : 6 }}
              transition={{ duration: 0.15 }}
            >
              {likes.length}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          transition={SPRING}
          onClick={(event) => {
            event.stopPropagation();
            openPost();
          }}
          className="flex items-center gap-2 rounded-full px-3 py-2 text-label-md text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
        >
          <MessageSquare className="h-4 w-4" />
          {comments}
          <span className="hidden sm:inline">
            {comments === 1 ? "Comment" : "Comments"}
          </span>
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          transition={SPRING}
          onClick={share}
          className="ml-auto flex items-center gap-2 rounded-full px-3 py-2 text-label-md text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Share</span>
        </motion.button>
      </div>
    </motion.article>
  );
};

export default PostRow;

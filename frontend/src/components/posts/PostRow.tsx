import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Share2, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import UserAvatar from "@/components/UserAvatar";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PostRecord, likeIds, toPlainText } from "@/lib/posts";
import { cn } from "@/lib/utils";

interface PostRowProps {
  post: PostRecord;
  onTagClick?: (tag: string) => void;
}

// One row in the community feed. The whole card opens the discussion; the
// action bar at the foot stops propagation so it can be used in place.
export const PostRow = ({ post, onTagClick }: PostRowProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [likes, setLikes] = useState<string[]>(likeIds(post));
  const [pending, setPending] = useState(false);

  const liked = !!user?.id && likes.includes(user.id);
  const excerpt = toPlainText(post.content);
  const comments = post.commentCount ?? 0;

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
    <article
      role="link"
      tabIndex={0}
      onClick={openPost}
      onKeyDown={(event) => event.key === "Enter" && openPost()}
      className="cursor-pointer rounded-card border border-border bg-card p-5 shadow-card transition-colors hover:border-primary/25 sm:p-6"
    >
      {/* Byline */}
      <div className="flex items-center gap-3">
        <UserAvatar
          src={post.userId.profile_picture || undefined}
          name={post.userId.name}
          size="md"
        />
        <div className="min-w-0">
          <p className="truncate text-label-md text-foreground">
            {post.userId.name}
          </p>
          <p className="flex flex-wrap items-center gap-x-2 text-body-sm text-muted-foreground">
            {post.userId.batch && <span>Class of {post.userId.batch}</span>}
            {post.userId.batch && <span aria-hidden="true">•</span>}
            <span>
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
          </p>
        </div>
      </div>

      <h3 className="mt-4 text-headline-md text-foreground">{post.title}</h3>

      {excerpt && (
        <p className="mt-1.5 line-clamp-2 text-body-md text-muted-foreground">
          {excerpt}
        </p>
      )}

      {(post.tags || []).length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags!.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onTagClick?.(tag);
              }}
              className="ap-chip transition-colors hover:bg-primary-subtle hover:text-primary-subtle-foreground"
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-1 border-t border-border pt-3">
        <button
          type="button"
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
          <ThumbsUp className={cn("h-4 w-4", liked && "fill-current")} />
          {likes.length}
        </button>

        <button
          type="button"
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
        </button>

        <button
          type="button"
          onClick={share}
          className="ml-auto flex items-center gap-2 rounded-full px-3 py-2 text-label-md text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>
    </article>
  );
};

export default PostRow;

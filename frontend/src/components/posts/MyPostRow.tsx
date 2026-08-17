import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Heart,
  MessageSquare,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CARD_HOVER,
  EASE_OUT,
  EXIT_BLOCK,
  SPRING,
  blockEntrance,
} from "@/lib/motion";
import {
  PostRecord,
  PostStatus,
  getPostImageUrl,
  likeIds,
  toPlainText,
} from "@/lib/posts";
import { cn } from "@/lib/utils";

const STATUS_PILL: Record<
  PostStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  approved: {
    label: "Approved",
    icon: CheckCircle2,
    className: "bg-success-subtle text-success",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-warning-subtle text-warning",
  },
  rejected: {
    label: "Rejected",
    icon: AlertTriangle,
    className: "bg-primary-subtle text-primary-subtle-foreground",
  },
};

interface MyPostRowProps {
  post: PostRecord;
  onDelete: (post: PostRecord) => void;
  /** Position in the list — staggers this row's entrance behind the one above. */
  index?: number;
}

export const MyPostRow = ({ post, onDelete, index = 0 }: MyPostRowProps) => {
  const navigate = useNavigate();

  const status: PostStatus = post.status || "pending";
  const pill = STATUS_PILL[status];
  const PillIcon = pill.icon;
  const rejected = status === "rejected";
  const excerpt = toPlainText(post.content);
  const coverImage =
    post.images && post.images.length > 0 ? post.images[0] : null;

  return (
    <motion.article
      {...blockEntrance(index)}
      whileHover={CARD_HOVER}
      exit={EXIT_BLOCK}
      transition={SPRING}
      layout
      className={cn(
        "rounded-card border p-5 shadow-card transition-colors sm:p-6",
        rejected ? "border-primary/25 bg-accent" : "border-border bg-card",
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-4">
        <motion.span
          key={status}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={SPRING}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-label-sm uppercase tracking-wide",
            pill.className,
          )}
        >
          <PillIcon className="h-3.5 w-3.5" />
          {pill.label}
        </motion.span>
        <span className="shrink-0 text-body-sm text-muted-foreground">
          {new Date(post.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-headline-md text-foreground">{post.title}</h3>
          {excerpt && (
            <p className="mt-1.5 whitespace-pre-line text-body-md text-muted-foreground">
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

          {status === "approved" && (
            <div className="mt-3 flex flex-wrap items-center gap-5 text-body-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Heart className="h-4 w-4" />
                {likeIds(post).length}
              </span>
              <span className="flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" />
                {post.commentCount ?? 0}
              </span>
            </div>
          )}

          {status === "pending" && (
            <p className="mt-3 text-body-sm italic text-muted-foreground">
              Reviewing… an administrator will publish this shortly.
            </p>
          )}

          {rejected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
              className="overflow-hidden"
            >
              <div className="mt-4 rounded-lg border-l-4 border-primary bg-card p-4">
                <p className="mb-1 text-label-md text-foreground">
                  Reviewer Feedback:
                </p>
                <p className="text-body-sm text-muted-foreground">
                  {post.rejection_reason ||
                    "No specific reason was given. Review the community guidelines and resubmit."}
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2 md:flex-col md:items-end">
          {status === "approved" && (
            <Button
              variant="outline"
              onClick={() => navigate(`/dashboard/posts/${post._id}`)}
              className="rounded-full border-primary px-5 text-label-md text-primary hover:bg-primary hover:text-primary-foreground"
            >
              View Post
            </Button>
          )}

          {rejected && (
            <Button
              variant="outline"
              onClick={() => navigate(`/dashboard/posts/${post._id}/edit`)}
              className="gap-1.5 rounded-full border-primary px-5 text-label-md text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Pencil className="h-4 w-4" />
              Edit &amp; Resubmit
            </Button>
          )}

          {!rejected && (
            <Button
              variant="ghost"
              onClick={() => navigate(`/dashboard/posts/${post._id}/edit`)}
              className="gap-1.5 rounded-full px-3 text-label-md text-muted-foreground hover:text-primary"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            aria-label={status === "pending" ? "Withdraw post" : "Delete post"}
            title={status === "pending" ? "Withdraw post" : "Delete post"}
            onClick={() => onDelete(post)}
            className="rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.article>
  );
};

export default MyPostRow;

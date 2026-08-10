import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, MessagesSquare, ThumbsUp } from "lucide-react";
import { PanelCard } from "@/components/dashboard/PanelCard";
import { PreloadLink } from "@/components/PreloadLink";
import UserAvatar from "@/components/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { PostRecord, likeIds, toPlainText } from "@/lib/posts";

const LIMIT = 5;

const RowSkeleton = () => (
  <div className="space-y-2.5 py-3">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-full" />
  </div>
);

// The home page's window onto the feed: the newest posts, bounded, with the
// full searchable listing one click away at /dashboard/posts. Deliberately
// read-only — liking and commenting happen on the post itself.
export const RecentPostsCard = () => {
  const navigate = useNavigate();

  const { data: posts = [], isLoading, isError } = useQuery({
    queryKey: ["posts", "recent", LIMIT],
    queryFn: async (): Promise<PostRecord[]> => {
      const { data } = await api.get(`/posts?page=1&limit=${LIMIT}`);
      return data?.data?.posts ?? [];
    },
    staleTime: 60 * 1000,
  });

  return (
    <PanelCard
      title="Recent Posts"
      action={
        <PreloadLink
          to="/dashboard/posts"
          className="shrink-0 text-label-md text-primary transition-colors hover:text-primary-hover"
        >
          View all
        </PreloadLink>
      }
      bodyClassName="px-4 py-0"
    >
      {isLoading ? (
        <div className="divide-y divide-border">
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </div>
      ) : isError || posts.length === 0 ? (
        <div className="py-10 text-center">
          <MessagesSquare className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-headline-md text-foreground">
            {isError ? "Couldn't load posts" : "No posts yet"}
          </h3>
          <p className="mt-1 text-body-sm text-muted-foreground">
            {isError
              ? "Try again in a moment."
              : "Be the first to share an update with the alumni network."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {posts.map((post) => {
            const excerpt = toPlainText(post.content);
            return (
              <li key={post._id}>
                <article
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate(`/dashboard/posts/${post._id}`)}
                  onKeyDown={(event) =>
                    event.key === "Enter" &&
                    navigate(`/dashboard/posts/${post._id}`)
                  }
                  className="group -mx-2 cursor-pointer rounded-lg px-2 py-3.5 transition-colors hover:bg-surface-low"
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
                      <p className="text-body-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(post.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>

                  <h3 className="mt-2.5 text-headline-md text-foreground transition-colors group-hover:text-primary">
                    {post.title}
                  </h3>

                  {excerpt && (
                    <p className="mt-1 line-clamp-2 text-body-md text-muted-foreground">
                      {excerpt}
                    </p>
                  )}

                  <div className="mt-2.5 flex items-center gap-5 text-muted-foreground">
                    <span className="flex items-center gap-1.5 text-label-sm">
                      <ThumbsUp className="h-4 w-4" />
                      {likeIds(post).length}
                    </span>
                    <span className="flex items-center gap-1.5 text-label-sm">
                      <MessageSquare className="h-4 w-4" />
                      {post.commentCount ?? 0}
                    </span>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </PanelCard>
  );
};

export default RecentPostsCard;

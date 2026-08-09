import { Link, useSearchParams } from "react-router-dom";
import { MessagesSquare, PenSquare, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SegmentedToggle,
  SegmentedToggleOption,
} from "@/components/ui/SegmentedToggle";
import CommunityPostsPanel from "@/components/posts/CommunityPostsPanel";
import MyPostsPanel from "@/components/posts/MyPostsPanel";
import { useAuth } from "@/context/AuthContext";

type Tab = "all" | "my";

const TAB_OPTIONS: readonly SegmentedToggleOption<Tab>[] = [
  { value: "all", label: "All Posts", icon: MessagesSquare },
  { value: "my", label: "My Posts", icon: User },
];

export default function Posts() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Only alumni (and admins) can publish, so only they get the My Posts half.
  const canPost = user?.role === "alumni" || user?.role === "admin";
  const tab: Tab = canPost && searchParams.get("tab") === "my" ? "my" : "all";

  const setTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams);
    if (next === "my") params.set("tab", "my");
    else params.delete("tab");
    setSearchParams(params, { replace: true });
  };

  const createButton = canPost ? (
    <Link to="/dashboard/posts/new" className="hidden sm:block">
      <Button className="gap-2 rounded-full bg-primary px-5 text-label-md text-primary-foreground hover:bg-primary-hover">
        <PenSquare className="h-4 w-4" />
        Create Post
      </Button>
    </Link>
  ) : undefined;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 text-foreground duration-500">
      <div className="mx-auto max-w-7xl pb-12">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mb-2 text-headline-lg-mobile text-primary md:text-headline-xl">
              {tab === "my" ? "My Posts" : "Community Posts"}
            </h1>
            <p className="text-body-lg text-muted-foreground">
              {tab === "my"
                ? "Manage your contributions to the alumni network."
                : "Insights and discussions from the network."}
            </p>
          </div>

          {canPost && (
            <SegmentedToggle
              label="Post view"
              value={tab}
              onChange={setTab}
              options={TAB_OPTIONS}
            />
          )}
        </div>

        {tab === "my" ? (
          <MyPostsPanel action={createButton} />
        ) : (
          <CommunityPostsPanel
            initialTag={searchParams.get("tag") || ""}
            action={createButton}
          />
        )}
      </div>

      {/* Mobile compose shortcut */}
      {canPost && (
        <Link
          to="/dashboard/posts/new"
          className="fixed bottom-20 right-4 z-30 sm:hidden"
        >
          <Button
            aria-label="Create a post"
            className="h-14 w-14 rounded-full bg-primary p-0 text-primary-foreground shadow-overlay hover:bg-primary-hover"
          >
            <PenSquare className="h-6 w-6" />
          </Button>
        </Link>
      )}
    </div>
  );
}

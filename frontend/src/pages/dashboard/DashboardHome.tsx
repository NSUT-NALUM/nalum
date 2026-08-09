import { Link } from "react-router-dom";
import { PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import PeopleYouMightKnow from "@/pages/dashboard/PeopleYouMightKnow";
import UpcomingEvents from "@/pages/dashboard/UpcomingEvents";
import CommunityPostsPanel from "@/components/posts/CommunityPostsPanel";
import { useAuth } from "@/context/AuthContext";

const DashboardHome = () => {
  const { user } = useAuth();
  const canPost = user?.role === "alumni" || user?.role === "admin";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 text-foreground duration-500">
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Feed */}
        <div className="min-w-0 flex-grow space-y-6">
          <CommunityPostsPanel />
        </div>

        {/* Rail */}
        <div className="order-first w-full flex-shrink-0 space-y-6 lg:order-none lg:w-72">
          {canPost && (
            <Link to="/dashboard/posts/new" className="hidden md:block">
              <Button className="w-full gap-2 rounded-full bg-primary text-label-md text-primary-foreground hover:bg-primary-hover">
                <PenSquare className="h-4 w-4" />
                Share an update
              </Button>
            </Link>
          )}

          <div className="hidden space-y-6 lg:block">
            <PeopleYouMightKnow />
            <UpcomingEvents />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;

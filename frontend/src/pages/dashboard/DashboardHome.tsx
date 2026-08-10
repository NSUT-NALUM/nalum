import QuickActions from "@/components/dashboard/QuickActions";
import SuggestedConnections from "@/components/dashboard/SuggestedConnections";
import UpcomingEventsCard from "@/components/dashboard/UpcomingEventsCard";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import RecentPostsCard from "@/components/posts/RecentPostsCard";

// Overview: greeting, the four things you're most likely to do, a window onto
// the feed, and a right rail of people and dates. The full post listing lives
// at /dashboard/posts — this page deliberately does not duplicate its search,
// tag filters or pagination.
const DashboardHome = () => (
  <div className="animate-in fade-in slide-in-from-bottom-4 text-foreground duration-500">
    <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
      {/* Main column */}
      <div className="flex flex-col gap-6 lg:col-span-8">
        <WelcomeBanner />
        <QuickActions />
        <RecentPostsCard />
      </div>

      {/* Rail — desktop only, matching the reference. The mobile bottom nav
          already covers Network and Events, so nothing here is stranded. */}
      <div className="hidden flex-col gap-6 lg:col-span-4 lg:flex">
        <SuggestedConnections />
        <UpcomingEventsCard />
      </div>
    </div>
  </div>
);

export default DashboardHome;

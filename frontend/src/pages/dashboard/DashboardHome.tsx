import { Stagger, StaggerItem } from "@/components/ui/motion";
import QuickActions from "@/components/dashboard/QuickActions";
import SuggestedConnections from "@/components/dashboard/SuggestedConnections";
import UpcomingEventsCard from "@/components/dashboard/UpcomingEventsCard";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import RecentPostsCard from "@/components/posts/RecentPostsCard";

// Overview: greeting, the four things you're most likely to do, a window onto
// the feed, and a right rail of people and dates. The full post listing lives
// at /dashboard/posts — this page deliberately does not duplicate its search,
// tag filters or pagination.
//
// The cascade *is* the page entrance — there's no separate page-level fade on
// top of it, which would only mean animating the same pixels twice. The rail
// starts a beat later so the eye reads the main column first.
const DashboardHome = () => (
  <div className="text-foreground">
    <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
      {/* Main column */}
      <Stagger className="flex flex-col gap-6 lg:col-span-8">
        <StaggerItem>
          <WelcomeBanner />
        </StaggerItem>
        <StaggerItem>
          <QuickActions />
        </StaggerItem>
        <StaggerItem>
          <RecentPostsCard />
        </StaggerItem>
      </Stagger>

      {/* Rail — desktop only, matching the reference. The mobile bottom nav
          already covers Network and Events, so nothing here is stranded. */}
      <Stagger
        delayChildren={0.14}
        className="hidden flex-col gap-6 lg:col-span-4 lg:flex"
      >
        <StaggerItem>
          <SuggestedConnections />
        </StaggerItem>
        <StaggerItem>
          <UpcomingEventsCard />
        </StaggerItem>
      </Stagger>
    </div>
  </div>
);

export default DashboardHome;

import { PreloadLink } from "@/components/PreloadLink";
import { useAuth } from "@/context/AuthContext";
import {
  countEventsThisWeek,
  usePendingConnections,
  useUpcomingEvents,
} from "@/hooks/useDashboardSummary";

const plural = (count: number, noun: string) =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;

// Everyone reads their own name first, so the greeting leads on the given name
// rather than the full legal one the profile stores.
const givenName = (name?: string) => name?.trim().split(/\s+/)[0] || "there";

export const WelcomeBanner = () => {
  const { user } = useAuth();
  const { data: pending = [] } = usePendingConnections();
  const { data: events = [] } = useUpcomingEvents();

  const requests = pending.length;
  const thisWeek = countEventsThisWeek(events);

  // Only ever mention what's actually waiting: a line that reads "0 requests"
  // is worse than no line at all.
  const clauses = [
    requests > 0 && `${plural(requests, "new connection request")}`,
    thisWeek > 0 && `${plural(thisWeek, "event")} this week`,
  ].filter(Boolean) as string[];

  const summary = clauses.length
    ? `You have ${clauses.join(" and ")}.`
    : "Here's what's happening across the alumni network.";

  return (
    <section className="relative overflow-hidden rounded-card border border-border bg-card p-5 shadow-card sm:p-6">
      {/* Soft crimson bloom off the right edge — decorative, never clickable. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 hidden h-64 w-64 rounded-full bg-gradient-to-br from-primary/10 to-transparent sm:block"
      />

      <div className="relative">
        <h1 className="text-headline-lg-mobile text-foreground md:text-headline-lg">
          Welcome back, {givenName(user?.name)}
        </h1>
        <p className="mt-1.5 text-body-md text-muted-foreground">{summary}</p>

        {requests > 0 && (
          <PreloadLink
            to="/dashboard/connections"
            className="mt-3 inline-flex items-center rounded-full bg-primary-subtle px-4 py-2 text-label-md text-primary-subtle-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Review requests
          </PreloadLink>
        )}
      </div>
    </section>
  );
};

export default WelcomeBanner;

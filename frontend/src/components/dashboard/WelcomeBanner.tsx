import { AnimatePresence, motion } from "framer-motion";
import { PreloadLink } from "@/components/PreloadLink";
import { useAuth } from "@/context/AuthContext";
import { DURATION, EASE_OUT, SPRING, popVariants } from "@/lib/motion";
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
      {/* Soft crimson bloom off the right edge — decorative, never clickable.
          It expands in behind the greeting rather than arriving with it, which
          is what keeps the banner feeling lit rather than assembled. */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.15 }}
        className="pointer-events-none absolute -right-24 -top-24 hidden h-64 w-64 rounded-full bg-gradient-to-br from-primary/10 to-transparent sm:block"
      />

      <div className="relative">
        <h1 className="text-headline-lg-mobile text-foreground md:text-headline-lg">
          Welcome back, {givenName(user?.name)}
        </h1>
        {/* The summary is keyed on its text so it crossfades when the pending
            counts settle, instead of the number visibly swapping in place. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={summary}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.fast }}
            className="mt-1.5 text-body-md text-muted-foreground"
          >
            {summary}
          </motion.p>
        </AnimatePresence>

        <AnimatePresence>
          {requests > 0 && (
            <motion.div
              variants={popVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={SPRING}
              className="mt-3 inline-block"
            >
              <PreloadLink
                to="/dashboard/alumni?tab=my"
                className="inline-flex items-center rounded-full bg-primary-subtle px-4 py-2 text-label-md text-primary-subtle-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Review requests
              </PreloadLink>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default WelcomeBanner;

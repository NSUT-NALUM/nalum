import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { PanelCard } from "@/components/dashboard/PanelCard";
import { PreloadLink } from "@/components/PreloadLink";
import { Skeleton } from "@/components/ui/skeleton";
import { useUpcomingEvents } from "@/hooks/useDashboardSummary";
import { formatEventTime } from "@/lib/events";
import { SPRING, rowEntrance } from "@/lib/motion";
import { cn } from "@/lib/utils";

const VISIBLE = 3;

const RowSkeleton = () => (
  <div className="flex items-center gap-3">
    <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
    <div className="flex-1 space-y-1.5">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-3 w-24" />
    </div>
  </div>
);

// The stacked date tile from the reference: month above, day below. The very
// next event gets the filled crimson treatment so the eye lands on it first.
const DateTile = ({ date, featured }: { date: Date; featured: boolean }) => (
  <motion.span
    variants={{ hover: { scale: 1.06 } }}
    transition={SPRING}
    className={cn(
      "flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg",
      featured
        ? "bg-primary text-primary-foreground"
        : "border border-border bg-surface-container-high text-foreground"
    )}
  >
    <span className="text-[10px] font-bold uppercase leading-none">
      {date.toLocaleDateString("en-US", { month: "short" })}
    </span>
    <span className="text-label-md leading-tight">
      {String(date.getDate()).padStart(2, "0")}
    </span>
  </motion.span>
);

// Right-rail module: the next few approved events, soonest first.
export const UpcomingEventsCard = () => {
  const navigate = useNavigate();
  const { data: events = [], isLoading, isError } = useUpcomingEvents();

  const rows = events.slice(0, VISIBLE);

  return (
    <PanelCard
      title="Upcoming Events"
      action={
        <PreloadLink
          to="/dashboard/events"
          className="shrink-0 text-label-md text-primary transition-colors hover:text-primary-hover"
        >
          View all
        </PreloadLink>
      }
    >
      {isLoading ? (
        <div className="space-y-4">
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </div>
      ) : isError || rows.length === 0 ? (
        <div className="py-4 text-center">
          <Calendar className="mx-auto mb-2 h-9 w-9 text-muted-foreground/50" />
          <p className="text-body-sm text-muted-foreground">
            {isError
              ? "Couldn't load events just now."
              : "Nothing on the calendar yet. Check back soon."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((event, index) => {
            const when = formatEventTime(event.event_time);
            return (
              <motion.li
                key={event._id}
                {...rowEntrance(index)}
                className="py-2 first:pt-0 last:pb-0"
              >
                <motion.button
                  type="button"
                  whileHover="hover"
                  whileTap={{ scale: 0.985 }}
                  transition={SPRING}
                  onClick={() => navigate(`/dashboard/events/${event._id}`)}
                  className="group flex w-full items-center gap-3 text-left"
                >
                  <DateTile
                    date={new Date(event.event_date)}
                    featured={index === 0}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-label-md text-foreground transition-colors group-hover:text-primary">
                      {event.title}
                    </span>
                    <span className="block truncate text-label-sm text-muted-foreground">
                      {[event.location, when].filter(Boolean).join(" • ")}
                    </span>
                  </span>
                </motion.button>
              </motion.li>
            );
          })}
        </ul>
      )}
    </PanelCard>
  );
};

export default UpcomingEventsCard;

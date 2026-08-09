import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Users, ThumbsUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BASE_URL } from "@/lib/constants";
import { eventTypeLabel } from "@/constants/eventTypes";
import {
  EventRecord,
  formatEventWhen,
  ensureUrlProtocol,
} from "@/lib/events";
import { cn } from "@/lib/utils";

interface EventRowProps {
  event: EventRecord;
  liked: boolean;
  onToggleLike: (eventId: string) => void;
  /** Shows the "Hosted by you" pill on events the viewer created. */
  isOwn?: boolean;
}

// Full-width horizontal event card: banner on the left, details on the right.
// Every event in the listing uses this same footprint — there is no separate
// featured treatment.
export const EventRow = ({
  event,
  liked,
  onToggleLike,
  isOwn,
}: EventRowProps) => {
  const navigate = useNavigate();
  const goToDetail = () => navigate(`/dashboard/events/${event._id}`);

  return (
    <article
      onClick={goToDetail}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-card border border-border bg-card shadow-card transition-colors hover:border-primary/30 md:flex-row"
    >
      {/* Banner */}
      <div className="relative h-48 shrink-0 bg-muted md:h-auto md:w-2/5">
        {event.image_url ? (
          <img
            src={`${BASE_URL}${event.image_url}`}
            alt={event.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-secondary">
            <Calendar className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        {isOwn && (
          <span className="absolute left-4 top-4 rounded-full bg-primary-subtle px-3 py-1 text-label-sm text-primary-subtle-foreground">
            Hosted by you
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between gap-4 p-6">
        <div>
          <div className="mb-3 flex items-start justify-between gap-4">
            <h3 className="text-headline-md text-foreground transition-colors group-hover:text-primary">
              {event.title}
            </h3>
            <span className="ap-chip ap-chip-primary shrink-0">
              {eventTypeLabel(event.event_type)}
            </span>
          </div>

          <div className="mb-1 flex items-center gap-2 text-body-sm text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>{formatEventWhen(event.event_date, event.event_time)}</span>
          </div>
          <div className="mb-1 flex items-center gap-2 text-body-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
          {event.max_participants ? (
            <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
              <Users className="h-4 w-4 shrink-0" />
              <span>Capacity: {event.max_participants}</span>
            </div>
          ) : null}

          <p className="mt-3 line-clamp-2 text-body-sm text-muted-foreground">
            {event.description}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={liked}
            aria-label={liked ? "Remove upvote" : "Upvote this event"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike(event._id);
            }}
            className={cn(
              "gap-1.5 rounded-full px-3 text-label-md",
              liked
                ? "text-primary hover:text-primary"
                : "text-muted-foreground hover:text-primary"
            )}
          >
            <ThumbsUp className={cn("h-4 w-4", liked && "fill-current")} />
            {event.likes}
          </Button>

          {event.registration_link ? (
            <a
              href={ensureUrlProtocol(event.registration_link)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <Button className="rounded-full bg-primary px-5 text-label-md text-primary-foreground hover:bg-primary-hover">
                Register
              </Button>
            </a>
          ) : (
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                goToDetail();
              }}
              className="gap-1.5 rounded-full border-border px-5 text-label-md hover:border-primary hover:text-primary"
            >
              View Event
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
};

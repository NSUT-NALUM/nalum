import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Calendar,
  MapPin,
  Users,
  Loader2,
  Pencil,
  Trash2,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import api from "@/lib/api";
import { BASE_URL } from "@/lib/constants";
import { eventTypeLabel } from "@/constants/eventTypes";
import { EventRecord, formatEventWhen, isPastEvent } from "@/lib/events";
import { cn } from "@/lib/utils";

// The five buckets a hosted event can sit in. "completed" is derived from the
// date rather than stored — the model only tracks pending/approved/rejected.
type Bucket = "all" | "approved" | "pending" | "rejected" | "completed";

const FILTERS: { value: Bucket; label: string }[] = [
  { value: "all", label: "All" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Action Required" },
  { value: "completed", label: "Completed" },
];

const bucketOf = (event: EventRecord): Exclude<Bucket, "all"> => {
  if (event.status === "rejected") return "rejected";
  if (event.status === "pending") return "pending";
  return isPastEvent(event.event_date) ? "completed" : "approved";
};

const STATUS_PILL: Record<
  Exclude<Bucket, "all">,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  approved: {
    label: "Approved",
    icon: CheckCircle2,
    className: "bg-success-subtle text-success",
  },
  pending: {
    label: "Pending Review",
    icon: Clock,
    className: "bg-warning-subtle text-warning",
  },
  rejected: {
    label: "Action Required",
    icon: AlertTriangle,
    className: "bg-primary-subtle text-primary-subtle-foreground",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-secondary text-secondary-foreground",
  },
};

// The "My Events" half of the Events page: a host's own submissions, their
// approval state, and the actions available on each.
export const MyEventsPanel = () => {
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Bucket>("all");
  const [hostingAllowed, setHostingAllowed] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<EventRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMyEvents = useCallback(async () => {
    try {
      const response = await api.get("/events/my/events");
      if (response.data.success) setEvents(response.data.data);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyEvents();

    api
      .get("/events/hosting-allowed")
      .then((res) => {
        if (res.data.success) setHostingAllowed(res.data.data.allowed);
      })
      .catch((error) => console.error("Error checking hosting status:", error));

    // Approval happens out of band, so poll for status changes while the
    // panel is open.
    const interval = setInterval(fetchMyEvents, 10000);
    return () => clearInterval(interval);
  }, [fetchMyEvents]);

  const visible =
    filter === "all" ? events : events.filter((e) => bucketOf(e) === filter);

  const counts = events.reduce<Record<string, number>>((acc, event) => {
    const bucket = bucketOf(event);
    acc[bucket] = (acc[bucket] || 0) + 1;
    return acc;
  }, {});

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await api.delete(`/events/delete/${deleteTarget._id}`);
      if (response.data.success) {
        toast.success("Event deleted");
        setDeleteTarget(null);
        fetchMyEvents();
      }
    } catch (error) {
      console.error("Failed to delete event:", error);
      toast.error("Failed to delete event");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter chips + host CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(({ value, label }) => {
            const count = value === "all" ? events.length : counts[value] || 0;
            return (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={cn(
                  "rounded-full border px-4 py-2 text-label-md transition-colors",
                  filter === value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
                )}
              >
                {label}
                {count > 0 && <span className="ml-1.5 opacity-70">{count}</span>}
              </button>
            );
          })}
        </div>

        {hostingAllowed && (
          <Link to="/dashboard/host-event">
            <Button className="gap-2 rounded-full bg-primary px-5 text-label-md text-primary-foreground hover:bg-primary-hover">
              <Plus className="h-4 w-4" />
              Host New Event
            </Button>
          </Link>
        )}
      </div>

      {!hostingAllowed && (
        <div className="rounded-card border border-warning/30 bg-warning-subtle p-4 text-body-sm text-foreground">
          Event hosting is temporarily disabled by administrators. You can still
          manage the events you have already submitted.
        </div>
      )}

      {/* Rows */}
      {visible.length === 0 ? (
        <EmptyState
          icon={<Calendar className="mx-auto h-14 w-14 text-muted-foreground/50" />}
          title={filter === "all" ? "No events yet" : "Nothing in this bucket"}
          description={
            filter === "all"
              ? "You haven't hosted an event yet. Share a reunion, mixer, or webinar with the community."
              : "Try a different filter to see your other submissions."
          }
          action={
            filter === "all" && hostingAllowed ? (
              <Link to="/dashboard/host-event">
                <Button className="gap-2 rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary-hover">
                  <Plus className="h-4 w-4" />
                  Host Your First Event
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {visible.map((event) => {
            const bucket = bucketOf(event);
            const pill = STATUS_PILL[bucket];
            const PillIcon = pill.icon;
            const needsAction = bucket === "rejected";
            // Pending events aren't publicly readable yet, so there is nothing
            // to link a detail page at.
            const canView = bucket !== "pending";

            return (
              <article
                key={event._id}
                className={cn(
                  "flex flex-col overflow-hidden rounded-card border shadow-card transition-colors md:flex-row",
                  needsAction
                    ? "border-primary/25 bg-accent"
                    : "border-border bg-card hover:border-primary/25"
                )}
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
                  <span
                    className={cn(
                      "absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-label-sm shadow-card",
                      pill.className
                    )}
                  >
                    <PillIcon className="h-3.5 w-3.5" />
                    {pill.label}
                  </span>
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between gap-4 p-6">
                  <div>
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <h3 className="text-headline-md text-foreground">
                        {event.title}
                      </h3>
                      <span className="ap-chip shrink-0">
                        {eventTypeLabel(event.event_type)}
                      </span>
                    </div>

                    <div className="mb-1 flex items-center gap-2 text-body-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span>
                        {formatEventWhen(event.event_date, event.event_time)}
                      </span>
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

                    {needsAction && (
                      <div className="mt-4 rounded-lg border border-border bg-card p-4">
                        <p className="mb-1 text-label-md text-foreground">
                          Reviewer Feedback:
                        </p>
                        <p className="text-body-sm text-muted-foreground">
                          {event.rejection_reason ||
                            "No specific reason was provided. Please review your details and resubmit."}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {needsAction ? (
                        <Button
                          variant="outline"
                          onClick={() =>
                            navigate(`/dashboard/events/${event._id}/edit`)
                          }
                          className="rounded-full border-primary px-5 text-label-md text-primary hover:bg-primary hover:text-primary-foreground"
                        >
                          Edit &amp; Resubmit
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          onClick={() =>
                            navigate(`/dashboard/events/${event._id}/edit`)
                          }
                          className="gap-1.5 rounded-full px-3 text-label-md text-muted-foreground hover:text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        onClick={() => setDeleteTarget(event)}
                        className="gap-1.5 rounded-full px-3 text-label-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>

                    {bucket === "pending" ? (
                      <span className="text-body-sm italic text-muted-foreground">
                        Waiting for review
                      </span>
                    ) : (
                      canView && (
                        <Button
                          onClick={() => navigate(`/dashboard/events/${event._id}`)}
                          className="gap-1.5 rounded-full bg-primary px-5 text-label-md text-primary-foreground hover:bg-primary-hover"
                        >
                          View Event
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete “{deleteTarget?.title}”? This cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
              className="flex-1"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

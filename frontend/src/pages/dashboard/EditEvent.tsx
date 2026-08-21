import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { EventForm } from "@/components/events/EventForm";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { EventRecord } from "@/lib/events";

const EditEvent = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<EventRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    setLoading(true);
    api
      .get(`/events/${eventId}`)
      .then((res) => {
        if (!res.data.success) {
          setError("This event could not be loaded.");
          return;
        }
        // The update endpoint enforces ownership too; this check just avoids
        // rendering a form that is guaranteed to fail on submit.
        const record = res.data.data as EventRecord;
        if (user?.email && record.creator_email !== user.email) {
          setError("You can only edit events that you host.");
          return;
        }
        setEvent(record);
      })
      .catch((err) => {
        console.error("Error fetching event:", err);
        setError("This event could not be loaded.");
      })
      .finally(() => setLoading(false));
  }, [eventId, user?.email]);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <EmptyState
          icon={<Calendar className="mx-auto h-14 w-14 text-muted-foreground/50" />}
          title="Event unavailable"
          description={error || "This event may have been removed."}
          action={
            <Button
              onClick={() => navigate("/dashboard/events?tab=my")}
              className="gap-2 rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary-hover"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to My Events
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 text-foreground duration-500">
      <EventForm mode="edit" event={event} />
    </div>
  );
};

export default EditEvent;

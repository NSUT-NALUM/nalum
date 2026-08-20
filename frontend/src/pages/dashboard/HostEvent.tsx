import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventForm } from "@/components/events/EventForm";
import api from "@/lib/api";

const HostEvent = () => {
  const navigate = useNavigate();
  const [hostingAllowed, setHostingAllowed] = useState(true);
  const [checkingHosting, setCheckingHosting] = useState(true);

  useEffect(() => {
    api
      .get("/events/hosting-allowed")
      .then((res) => {
        if (res.data.success) setHostingAllowed(res.data.data.allowed);
      })
      .catch((error) => console.error("Error checking hosting status:", error))
      .finally(() => setCheckingHosting(false));
  }, []);

  if (checkingHosting) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hostingAllowed) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <div className="rounded-card border border-warning/30 bg-warning-subtle p-10 text-center shadow-card">
          <Calendar className="mx-auto mb-4 h-14 w-14 text-warning" />
          <h1 className="mb-2 text-headline-md text-foreground">
            Event hosting is temporarily disabled
          </h1>
          <p className="text-body-md text-muted-foreground">
            Administrators have paused alumni event submissions. Please check back
            later.
          </p>
          <Button
            onClick={() => navigate("/dashboard/events")}
            className="mt-6 rounded-full bg-primary px-6 text-primary-foreground hover:bg-primary-hover"
          >
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 text-foreground duration-500">
      <EventForm mode="create" />
    </div>
  );
};

export default HostEvent;

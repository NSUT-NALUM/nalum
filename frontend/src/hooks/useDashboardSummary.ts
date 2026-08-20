import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { EventRecord } from "@/lib/events";

/**
 * The soonest approved events. `/events/approved` already filters to today
 * onwards and sorts ascending by date, so the first page *is* the upcoming
 * list — no client-side sorting needed.
 *
 * We over-fetch a little: the rail shows three, but the welcome banner counts
 * how many land inside the next seven days, and that count would be wrong if
 * we only ever held three rows.
 */
const UPCOMING_LIMIT = 8;

export const useUpcomingEvents = () =>
  useQuery({
    queryKey: ["events", "upcoming", UPCOMING_LIMIT],
    queryFn: async (): Promise<EventRecord[]> => {
      const { data } = await api.get(
        `/events/approved?page=1&limit=${UPCOMING_LIMIT}`
      );
      return data.success ? data.data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

/**
 * Connection requests waiting on the viewer. Shares its key with the copy in
 * DashboardLayout so the two mount points resolve to a single request.
 */
export const usePendingConnections = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["connections", user?.id, "received"],
    queryFn: async () => {
      const { data } = await api.get("/chat/connections/pending");
      return (data.data ?? []) as unknown[];
    },
  });
};

/** Events starting between now and seven days out. */
export const countEventsThisWeek = (events: EventRecord[]) => {
  const horizon = Date.now() + 7 * 24 * 60 * 60 * 1000;
  return events.filter((event) => {
    const at = new Date(event.event_date).getTime();
    return !Number.isNaN(at) && at <= horizon;
  }).length;
};

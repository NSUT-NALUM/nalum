import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  MessageSquare,
  Search,
  UserCheck,
  UserMinus,
  UserX,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import UserAvatar from "@/components/UserAvatar";
import SuggestedConnections from "@/components/dashboard/SuggestedConnections";
import { useAuth } from "@/context/AuthContext";
import { useConversations } from "@/hooks/useConversations";
import api from "@/lib/api";
import { apiErrorMessage, cn } from "@/lib/utils";

type Bucket = "connected" | "received" | "sent" | "blocked";

const FILTERS: { value: Bucket; label: string }[] = [
  { value: "connected", label: "Connected" },
  { value: "received", label: "Requests" },
  { value: "sent", label: "Sent" },
  { value: "blocked", label: "Blocked" },
];

interface ConnectionRow {
  _id: string;
  otherUser: {
    _id: string;
    name: string;
    email?: string;
    profilePicture?: string;
    profile_picture?: string;
  };
}

// The "My Connections" half of the Directory page: the viewer's own network
// (accepted / received / sent), rebuilt light-themed to replace the old
// standalone /dashboard/connections page.
export const MyConnectionsPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { createConversation } = useConversations();

  const [bucket, setBucket] = useState<Bucket>("connected");
  const [search, setSearch] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);

  const { data: connected = [], isLoading: loadingConnected } = useQuery({
    queryKey: ["connections", user?.id, "accepted"],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await api.get("/chat/connections?status=accepted");
      return data.data ?? [];
    },
  });

  const { data: received = [], isLoading: loadingReceived } = useQuery({
    queryKey: ["connections", user?.id, "received"],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await api.get("/chat/connections/pending");
      return data.data ?? [];
    },
  });

  const { data: sent = [], isLoading: loadingSent } = useQuery({
    queryKey: ["connections", user?.id, "sent"],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await api.get("/chat/connections/sent");
      return data.data ?? [];
    },
  });

  const { data: blocked = [], isLoading: loadingBlocked } = useQuery({
    queryKey: ["connections", user?.id, "blocked"],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await api.get("/chat/connections?status=blocked");
      return data.data ?? [];
    },
  });

  const invalidateAll = () =>
    queryClient.invalidateQueries({ queryKey: ["connections"] });

  const handleMessage = async (recipientId: string) => {
    try {
      const conversation = await createConversation.mutateAsync(recipientId);
      navigate("/dashboard/chat", { state: { conversation } });
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to start conversation"));
    }
  };

  const handleRemove = async (connectionId: string) => {
    setActioningId(connectionId);
    try {
      await api.delete(`/chat/connections/${connectionId}`);
      toast.success("Connection removed");
      invalidateAll();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to remove connection"));
    } finally {
      setActioningId(null);
    }
  };

  const respond = async (connectionId: string, action: "accept" | "reject") => {
    setActioningId(connectionId);
    try {
      await api.post("/chat/connections/respond", { connectionId, action });
      toast.success(action === "accept" ? "Request accepted" : "Request declined");
      invalidateAll();
    } catch (error) {
      toast.error(apiErrorMessage(error, `Failed to ${action} request`));
    } finally {
      setActioningId(null);
    }
  };

  const cancel = async (recipientId: string) => {
    setActioningId(recipientId);
    try {
      await api.delete(`/chat/connections/cancel/${recipientId}`);
      toast.success("Request canceled");
      invalidateAll();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to cancel request"));
    } finally {
      setActioningId(null);
    }
  };

  const handleUnblock = async (targetUserId: string) => {
    setActioningId(targetUserId);
    try {
      await api.post("/chat/connections/unblock-user", { targetUserId });
      toast.success("User unblocked");
      invalidateAll();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to unblock user"));
    } finally {
      setActioningId(null);
    }
  };

  const rows: ConnectionRow[] = useMemo(() => {
    const source =
      bucket === "connected"
        ? connected.map((c: any) => ({
            ...c,
            otherUser: c.requester?._id === user?.id ? c.recipient : c.requester,
          }))
        : bucket === "received"
          ? received.map((c: any) => ({ ...c, otherUser: c.requester }))
          : bucket === "sent"
            ? sent.map((c: any) => ({ ...c, otherUser: c.recipient }))
            : blocked
                .filter((c: any) => c.blockedBy === user?.id)
                .map((c: any) => ({
                  ...c,
                  otherUser: c.requester?._id === user?.id ? c.recipient : c.requester,
                }));

    const term = search.trim().toLowerCase();
    const filtered = term
      ? source.filter((row: any) =>
          row.otherUser?.name?.toLowerCase().includes(term)
        )
      : source;

    return filtered.filter((row: any) => row.otherUser?._id);
  }, [bucket, connected, received, sent, blocked, search, user?.id]);

  const isLoading =
    bucket === "connected"
      ? loadingConnected
      : bucket === "received"
        ? loadingReceived
        : bucket === "sent"
          ? loadingSent
          : loadingBlocked;

  const counts: Record<Bucket, number> = {
    connected: connected.length,
    received: received.length,
    sent: sent.length,
    blocked: blocked.filter((c: any) => c.blockedBy === user?.id).length,
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative min-w-0">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={`Search ${bucket}…`}
          className="h-12 w-full rounded-full border border-border bg-card pl-12 pr-12 text-body-md text-foreground shadow-card placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Bucket chips */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setBucket(value)}
            className={cn(
              "rounded-full border px-4 py-2 text-label-md transition-colors",
              bucket === value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
            )}
          >
            {label}
            {counts[value] > 0 && (
              <span className="ml-1.5 opacity-70">{counts[value]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Rows */}
      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Users className="mx-auto h-14 w-14 text-muted-foreground/50" />}
          title={
            search
              ? "No matches"
              : bucket === "connected"
                ? "No connections yet"
                : bucket === "received"
                  ? "No pending requests"
                  : bucket === "sent"
                    ? "No sent requests"
                    : "No blocked users"
          }
          description={
            search
              ? "Try a different search term."
              : bucket === "connected"
                ? "Browse the directory and start connecting with fellow alumni."
                : bucket === "received"
                  ? "You're all caught up — new requests will show up here."
                  : bucket === "sent"
                    ? "Requests you send will show up here until they're accepted."
                    : "Users you block will appear here."
          }
        />
      ) : (
        <div className="space-y-3">
          {rows.map((row: any) => (
            <div
              key={row._id}
              className="flex items-center gap-4 rounded-card border border-border bg-card p-4 shadow-card transition-colors hover:border-primary/25"
            >
              <button
                type="button"
                onClick={() => navigate(`/dashboard/alumni/${row.otherUser._id}`)}
                className="flex min-w-0 flex-1 items-center gap-4 text-left"
              >
                <UserAvatar
                  src={row.otherUser.profilePicture || row.otherUser.profile_picture}
                  name={row.otherUser.name}
                  size="md"
                  className="shrink-0"
                />
                <div className="min-w-0">
                  <p className="truncate text-label-md text-foreground">
                    {row.otherUser.name}
                  </p>
                  {row.otherUser.email && (
                    <p className="truncate text-body-sm text-muted-foreground">
                      {row.otherUser.email}
                    </p>
                  )}
                </div>
              </button>

              <div className="flex shrink-0 items-center gap-2">
                {bucket === "connected" && (
                  <>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleMessage(row.otherUser._id)}
                      className="h-9 w-9 rounded-full border-border text-primary hover:border-primary hover:bg-primary-subtle"
                      aria-label={`Message ${row.otherUser.name}`}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={actioningId === row._id}
                      onClick={() => handleRemove(row._id)}
                      className="h-9 w-9 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Remove ${row.otherUser.name}`}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </>
                )}

                {bucket === "received" && (
                  <>
                    <Button
                      size="sm"
                      disabled={actioningId === row._id}
                      onClick={() => respond(row._id, "accept")}
                      className="gap-1.5 rounded-full bg-primary px-4 text-label-md text-primary-foreground hover:bg-primary-hover"
                    >
                      <UserCheck className="h-4 w-4" />
                      Accept
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={actioningId === row._id}
                      onClick={() => respond(row._id, "reject")}
                      className="h-9 w-9 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Decline ${row.otherUser.name}`}
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  </>
                )}

                {bucket === "sent" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actioningId === row.otherUser._id}
                    onClick={() => cancel(row.otherUser._id)}
                    className="rounded-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    Cancel
                  </Button>
                )}

                {bucket === "blocked" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actioningId === row.otherUser._id}
                    onClick={() => handleUnblock(row.otherUser._id)}
                    className="rounded-full border-border text-foreground hover:bg-muted"
                  >
                    Unblock
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommended */}
      <div className="pt-4">
        <SuggestedConnections />
      </div>
    </div>
  );
};

export default MyConnectionsPanel;

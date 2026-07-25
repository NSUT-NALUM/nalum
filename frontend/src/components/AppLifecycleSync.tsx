import { ReactNode, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/hooks/useSocket";

export function AuthenticatedCacheBoundary({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    const currentUserId = user?.id ?? null;
    if (previousUserId.current === currentUserId) return;

    const staleUserId = previousUserId.current;
    const isStaleAuthenticatedQuery = (query: { queryKey: readonly unknown[] }) => {
      const root = String(query.queryKey[0]);
      if (root === "search-users") return staleUserId !== null;

      return staleUserId !== null && [
        "inbox",
        "conversations",
        "messages",
        "connections",
        "pending-requests",
      ].includes(root) && query.queryKey[1] === staleUserId;
    };

    void queryClient.cancelQueries({ predicate: isStaleAuthenticatedQuery });
    queryClient.removeQueries({ predicate: isStaleAuthenticatedQuery });
    previousUserId.current = currentUserId;
  }, [queryClient, user?.id]);

  return children;
}

export function ConnectionLifecycleSync() {
  const { socket } = useSocket();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const pathnameRef = useRef(location.pathname);

  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (!socket || !user?.id) return;

    const refreshChatState = () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["connections"] }),
        queryClient.invalidateQueries({ queryKey: ["pending-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["inbox", user.id] }),
        queryClient.invalidateQueries({ queryKey: ["conversations", user.id] }),
      ]);
    };

    const removeWorkflow = (payload: {
      connectionId?: string;
      conversationId?: string | null;
    }) => {
      const { connectionId, conversationId } = payload;
      const withoutConnection = (old: unknown) => Array.isArray(old)
        ? old.filter((item: any) => item?._id !== connectionId)
        : old;
      const withoutConversation = (old: unknown) => Array.isArray(old)
        ? old.filter((item: any) => item?._id !== conversationId)
        : old;

      queryClient.setQueriesData({ queryKey: ["connections"] }, withoutConnection);
      queryClient.setQueriesData({ queryKey: ["pending-requests"] }, withoutConnection);

      if (conversationId) {
        queryClient.setQueriesData({ queryKey: ["inbox", user.id] }, withoutConversation);
        queryClient.setQueriesData({ queryKey: ["conversations", user.id] }, withoutConversation);
        queryClient.removeQueries({ queryKey: ["messages", user.id, conversationId] });

        if (pathnameRef.current === `/dashboard/chat/${conversationId}`) {
          navigate("/dashboard/chat", { replace: true });
        }
      }

      refreshChatState();
    };

    socket.on("connect", refreshChatState);
    socket.on("connection:cancelled", removeWorkflow);
    socket.on("conversation:removed", removeWorkflow);
    if (socket.connected) refreshChatState();

    return () => {
      socket.off("connect", refreshChatState);
      socket.off("connection:cancelled", removeWorkflow);
      socket.off("conversation:removed", removeWorkflow);
    };
  }, [navigate, queryClient, socket, user?.id]);

  return null;
}

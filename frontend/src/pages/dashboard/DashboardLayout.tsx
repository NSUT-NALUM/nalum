import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { ProfileProvider, useProfile } from "@/context/ProfileContext";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Home, Users, Calendar } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import ProfileMenu from "@/components/ProfileMenu";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Suspense, useEffect, useState } from "react";

import { useChatContext } from "@/context/ChatContext";
import { useLocationGuard } from "@/hooks/useLocationGuard";
import { PreloadLink } from "@/components/PreloadLink";

const DashboardContent = () => {
  const location = useLocation();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const isChatPage = location.pathname.startsWith("/dashboard/chat");
  const isConnectionsPage = location.pathname.startsWith("/dashboard/connections");
  const isNotificationsPage = location.pathname.startsWith("/dashboard/notifications");
  const { profile } = useProfile();
  const { user } = useAuth();
  const { socket } = useChatContext();
  const queryClient = useQueryClient();

  // Enforce profile completion and location
  useLocationGuard();

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ["connections", user?.id, "received"],
    queryFn: async () => {
      const { data } = await api.get("/chat/connections/pending");
      return data.data;
    },
  });

  useEffect(() => {
    if (!socket) return;
    const handleConnectionRequest = () => {
      queryClient.invalidateQueries({ queryKey: ["connections", user?.id, "received"] });
    };
    socket.on("connection_request", handleConnectionRequest);
    return () => {
      socket.off("connection_request", handleConnectionRequest);
    };
  }, [socket, queryClient]);

  const hasPendingRequests = pendingRequests.length > 0;

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-slate-950 text-slate-100 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      {/* ... (background glow) ... */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      {/* Mobile Bottom Navigation Bar */}
      {!isChatPage && !isNotificationsPage && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-lg border-t border-white/10 flex items-center justify-around px-2 py-2 shadow-2xl md:hidden h-16">
          <PreloadLink
            to="/dashboard"
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300",
              location.pathname === "/dashboard"
                ? "bg-blue-600/20 text-blue-400"
                : "text-gray-400 hover:text-white"
            )}
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-medium">Home</span>
          </PreloadLink>

          <PreloadLink
            to="/dashboard/connections"
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 relative",
              location.pathname === "/dashboard/connections"
                ? "bg-blue-600/20 text-blue-400"
                : "text-gray-400 hover:text-white"
            )}
          >
            <Users className="h-5 w-5" />
            <span className="text-[10px] font-medium">Network</span>
            {hasPendingRequests && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-slate-950" />
            )}
          </PreloadLink>

          <PreloadLink
            to="/dashboard/posts"
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300",
              location.pathname === "/dashboard/posts"
                ? "bg-blue-600/20 text-blue-400"
                : "text-gray-400 hover:text-white"
            )}
          >
            <div className="w-6 h-6 border-2 border-current rounded-md flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-[10px] font-medium">Post</span>
          </PreloadLink>

          <PreloadLink
            to="/dashboard/events"
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300",
              location.pathname === "/dashboard/events"
                ? "bg-blue-600/20 text-blue-400"
                : "text-gray-400 hover:text-white"
            )}
          >
            <Calendar className="h-5 w-5" />
            <span className="text-[10px] font-medium">Events</span>
          </PreloadLink>

          <button
            onClick={() => setIsProfileMenuOpen(true)}
            className="flex flex-col items-center gap-1 transition-all"
          >
            <UserAvatar
              src={profile?.profile_picture}
              name={profile?.user?.name || "User"}
              size="sm"
              className={cn(
                "h-7 w-7 ring-2",
                isProfileMenuOpen
                  ? "ring-blue-500"
                  : "ring-transparent"
              )}
            />
            <span className={cn(
              "text-[10px] font-medium",
              isProfileMenuOpen
                ? "text-blue-400"
                : "text-gray-400"
            )}>Profile</span>
          </button>
        </div>
      )}

      {/* Profile Menu */}
      <ProfileMenu isOpen={isProfileMenuOpen} onClose={() => setIsProfileMenuOpen(false)} />

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 h-full z-10 scrollbar-hide flex flex-col",
        isChatPage || isNotificationsPage ? "overflow-hidden" : "overflow-y-auto"
      )}>
        {/* Header — single component for mobile and desktop, sticky and always in the
            document flow (not an overlay), so page content no longer needs manual
            top-padding to avoid sitting underneath it. Height matches the sidebar's
            logo block exactly (h-20, the same fixed height both use). */}
        {!isNotificationsPage && <Header />}
        <div
          className={cn(
            "relative mx-auto transition-all duration-300 min-h-full flex flex-col",
            isChatPage
              ? "pt-0 pb-0 px-0 max-w-full h-full"
              : isNotificationsPage
                ? "pt-0 pb-0 px-0 max-w-full h-full"
                : isConnectionsPage
                  ? "pb-0 px-0 max-w-full"
                  : "px-4 pt-4 pb-20 md:p-8 max-w-7xl"
          )}
        >
          <Suspense
            fallback={
              <div className="p-8 text-slate-400">
                Loading page...
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
};

const DashboardLayout = () => {
  return (
    <ProfileProvider>
      <DashboardContent />
      <PWAInstallPrompt />
    </ProfileProvider>
  );
};

export default DashboardLayout;

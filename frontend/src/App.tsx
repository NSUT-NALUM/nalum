import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { startKeepAlive, stopKeepAlive } from "@/lib/keepAlive";
import { AppRoutes } from "@/routes";
import { AuthErrorHandler, SessionLoadingScreen } from "@/components/app/AppComponents";

// Create QueryClient instance outside component to avoid recreating on each render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// App Content with Session Check
function AppContent() {
  const { isRestoringSession } = useAuth();

  if (isRestoringSession) {
    return <SessionLoadingScreen />;
  }

  return (
    <>
      <AuthErrorHandler />
      <TooltipProvider>
        <AppRoutes />
        <Toaster />
      </TooltipProvider>
    </>
  );
}

function App() {
  useEffect(() => {
    // Start keep-alive when app mounts
    startKeepAlive();

    // Cleanup on unmount
    return () => {
      stopKeepAlive();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

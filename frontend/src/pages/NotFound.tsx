import { useLocation } from "react-router-dom";
import { PreloadLink } from "@/components/PreloadLink";
import { useEffect } from "react";
import { AlertCircle, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center max-w-2xl w-full space-y-8">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4 ring-1 ring-primary/20">
            <AlertCircle className="h-12 w-12 text-primary" aria-hidden="true" />
          </div>
        </div>
        
        <div className="space-y-4">
          <p className="text-base font-semibold leading-8 text-primary">Error 404</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            This page does not exist
          </h1>
          <p className="mt-6 text-base leading-7 text-muted-foreground max-w-md mx-auto">
            The link you followed may be broken, or the page may have been removed. Let's get you back on track.
          </p>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <PreloadLink to="/">
            <Button className="w-full sm:w-auto px-6 py-6 text-base gap-2 bg-primary hover:bg-primary-hover text-primary-foreground shadow-sm">
              <Home className="w-5 h-5" />
              Go back home
            </Button>
          </PreloadLink>
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="w-full sm:w-auto px-6 py-6 text-base gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Previous page
          </Button>
        </div>

        <div className="mt-16 border-t border-border pt-8">
          <p className="text-sm text-muted-foreground">
            If you believe this is an error, please contact the NSUT Alumni Association support team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

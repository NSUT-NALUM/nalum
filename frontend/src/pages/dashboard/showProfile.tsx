import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, PenLine } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import ProfileView from "@/components/profile/ProfileView";
import MyPostsPanel from "@/components/posts/MyPostsPanel";

const ShowProfile = () => {
  const navigate = useNavigate();
  const { profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-body-md text-muted-foreground">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="rounded-card border border-border bg-card shadow-card p-8 text-center max-w-md">
          <p className="text-body-md text-muted-foreground mb-4">
            Profile not found
          </p>
          <Button
            onClick={() => navigate("/dashboard")}
            className="bg-primary hover:bg-primary-hover text-primary-foreground"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ProfileView
      profile={profile}
      backLabel="Back to Dashboard"
      onBack={() => navigate("/dashboard")}
      heading={{
        title: "My Profile",
        subtitle: "This is how your profile appears to the rest of the network.",
      }}
      actions={
        <Button
          onClick={() => navigate("/dashboard/update-profile")}
          className="bg-primary hover:bg-primary-hover text-primary-foreground"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      }
      bioFallback={
        <button
          type="button"
          onClick={() => navigate("/dashboard/update-profile")}
          className="w-full rounded-card border border-dashed border-border bg-card/50 p-6 text-left hover:border-primary/40 hover:bg-primary/[0.02] transition-colors group"
        >
          <h3 className="text-headline-md text-foreground mb-1 flex items-center gap-2">
            <PenLine className="h-[18px] w-[18px] text-primary/70" />
            Add an About section
          </h3>
          <p className="text-body-sm text-muted-foreground">
            A short summary of your work and interests helps others decide to
            reach out.{" "}
            <span className="text-primary font-medium group-hover:underline">
              Write one now
            </span>
          </p>
        </button>
      }
    >
      {/* My Posts lives on the profile only on mobile — desktop has its own page. */}
      <div className="md:hidden pt-6 border-t border-border">
        <MyPostsPanel embedded />
      </div>
    </ProfileView>
  );
};

export default ShowProfile;

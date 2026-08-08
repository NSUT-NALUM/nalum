import { GraduationCap, Briefcase } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { ConnectionButton } from "@/components/ui/ConnectionButton";
import type { AlumniProfile } from "@/hooks/useAlumniDirectory";

interface AlumniCardProps {
  alumni: AlumniProfile;
  onConnect: (userId: string, message?: string) => void;
  onClick: () => void;
}

export const AlumniCard = ({ alumni, onConnect, onClick }: AlumniCardProps) => {

  return (
    <div
      onClick={onClick}
      className="group rounded-xl border border-border bg-card hover:bg-accent transition-all duration-300 cursor-pointer p-6 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/50 flex flex-col h-full min-w-0 overflow-hidden"
    >
      {/* Header Section */}
      <div className="flex items-center gap-4 mb-6 w-full min-w-0">
        <UserAvatar
          src={alumni.profile_picture}
          name={alumni.user.name}
          size="lg"
          className="ring-2 ring-border shrink-0"
        />
        <div className="flex-1 overflow-hidden">
          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors truncate">
            {alumni.user.name}
          </h3>
          {alumni.batch && (
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {alumni.batch}
            </p>
          )}
        </div>
      </div>

      {/* Body Section */}
      <div className="space-y-4 mb-6 flex-1 w-full min-w-0">
        {/* Branch Block */}
        {alumni.branch && (
          <div className="flex items-start gap-3 w-full min-w-0">
            <GraduationCap className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground truncate mt-0.5">
                {alumni.branch}
              </p>
            </div>
          </div>
        )}

        {/* Role & Company Block */}
        {(alumni.current_role || alumni.current_company) && (
          <div className="flex items-start gap-3 w-full min-w-0">
            <Briefcase className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              {alumni.current_role && (
                <p className="text-sm font-medium text-primary truncate">
                  {alumni.current_role}
                </p>
              )}
              {alumni.current_company && (
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {alumni.current_company}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div onClick={(e) => e.stopPropagation()} className="mt-auto w-full min-w-0">
        <ConnectionButton
          status={alumni.connectionStatus}
          userId={alumni.user._id}
          onConnect={onConnect}
          size="default"
          fullWidth
          recipientName={alumni.user.name}
        />
      </div>
    </div>
  );
};

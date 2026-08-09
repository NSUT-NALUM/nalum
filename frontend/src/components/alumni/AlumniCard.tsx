import { GraduationCap, Briefcase, Building2 } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { ConnectionButton } from "@/components/ui/ConnectionButton";
import type { AlumniProfile } from "@/hooks/useAlumniDirectory";

interface AlumniCardProps {
  alumni: AlumniProfile;
  onConnect: (userId: string, message?: string) => void;
  onClick: () => void;
}

export const AlumniCard = ({ alumni, onConnect, onClick }: AlumniCardProps) => {
  const isStudent = alumni.user.role === "student";
  const classLabel = alumni.batch
    ? `${isStudent ? "Student - " : ""}Class of ${alumni.batch}`
    : undefined;

  return (
    <div
      onClick={onClick}
      className="group rounded-card border border-border bg-card hover:bg-accent transition-all duration-300 cursor-pointer p-6 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/50 flex flex-col h-full min-w-0 overflow-hidden"
    >
      {/* Header Section */}
      <div className="flex items-center gap-4 mb-4 w-full min-w-0">
        <UserAvatar
          src={alumni.profile_picture}
          name={alumni.user.name}
          size="lg"
          className="ring-2 ring-border shrink-0"
        />
        <div className="flex-1 overflow-hidden">
          <h3 className="text-headline-md text-foreground group-hover:text-primary transition-colors truncate">
            {alumni.user.name}
          </h3>
          {classLabel && (
            <p className="text-body-sm text-muted-foreground truncate">
              {classLabel}
            </p>
          )}
        </div>
      </div>

      {/* Body Section */}
      <div className="space-y-3 mb-4 flex-1 w-full min-w-0">
        {/* Branch Block */}
        {alumni.branch && (
          <div className="flex items-start gap-3 w-full min-w-0">
            <GraduationCap className="w-[18px] h-[18px] text-primary/70 shrink-0 mt-0.5" />
            <p className="text-body-md text-foreground flex-1 min-w-0 truncate">
              {alumni.branch}
            </p>
          </div>
        )}

        {/* Role & Company Block */}
        {(alumni.current_role || alumni.current_company) && (
          <div className="flex items-start gap-3 w-full min-w-0">
            <Briefcase className="w-[18px] h-[18px] text-primary/70 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              {alumni.current_role && (
                <p className="text-body-md text-foreground truncate">
                  {alumni.current_role}
                </p>
              )}
              {alumni.current_company && (
                <p className="text-body-sm text-muted-foreground truncate mt-0.5">
                  {alumni.current_company}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Campus Block (stands in for location) */}
        {alumni.campus && (
          <div className="flex items-start gap-3 w-full min-w-0">
            <Building2 className="w-[18px] h-[18px] text-primary/70 shrink-0 mt-0.5" />
            <p className="text-body-md text-muted-foreground flex-1 min-w-0 truncate">
              {alumni.campus}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="mt-auto pt-4 border-t border-border/50 w-full min-w-0"
      >
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

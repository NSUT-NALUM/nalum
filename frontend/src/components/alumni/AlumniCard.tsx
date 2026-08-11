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
      className="group rounded-xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/30 flex flex-col h-full"
    >
      {/* 
        Header Section:
        Uses flex-row to place the Avatar on the left and stack the Name/Batch vertically on the right.
        'shrink-0' on the Avatar prevents it from squishing if the text is very long.
      */}
      <div className="flex items-center gap-4 mb-6">
        <UserAvatar
          src={alumni.profile_picture}
          name={alumni.user.name}
          size="lg"
          className="ring-2 ring-white/10 shrink-0"
        />
        <div className="flex-1 overflow-hidden">
          <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors truncate">
            {alumni.user.name}
          </h3>
          {alumni.batch && (
            <p className="text-sm text-gray-400 mt-1 truncate">
              Batch of {alumni.batch}
            </p>
          )}
        </div>
      </div>

      {/* 
        Body Section:
        Contains Role/Company and Location details. 
        'flex-1' ensures this section expands to fill any empty vertical space created when the card 
        is stretched by the grid's auto-rows-fr. This expansion naturally pushes the footer (Connect button) 
        all the way to the bottom, aligning all buttons perfectly.
      */}
      <div className="space-y-4 mb-6 flex-1">
        {/* 
          Role & Company Block:
          Only renders if data is available. If missing, the Branch block slides up.
        */}
        {(alumni.current_role || alumni.current_company) && (
          <div className="flex items-start gap-3 w-full">
            <Briefcase className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
            {/* 'min-w-0' is crucial here: it prevents flex children from blowing out their container width, allowing 'truncate' to work properly on long text strings. */}
            <div className="flex-1 min-w-0">
              {alumni.current_role && (
                <p className="text-sm font-medium text-blue-400 truncate">
                  {alumni.current_role}
                </p>
              )}
              {alumni.current_company && (
                <p className="text-sm text-gray-400 truncate mt-0.5">
                  {alumni.current_company}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Branch Block */}
        {alumni.branch && (
          <div className="flex items-start gap-3 w-full">
            <GraduationCap className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-300 truncate mt-0.5">
                {alumni.branch}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 
        Footer / Connection Button Section:
        'mt-auto' pushes this section to the very bottom of the card, ensuring all buttons align 
        horizontally across multiple cards regardless of how much text is in the body above.
      */}
      <div onClick={(e) => e.stopPropagation()} className="mt-auto">
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

import { useState } from "react";
import { Button } from "./button";
import { UserPlus } from "lucide-react";
import { ConnectionMessageDialog } from "../ConnectionMessageDialog";

interface ConnectionButtonProps {
  status?: string;
  userId: string;
  onConnect: (userId: string, message?: string) => void;
  size?: "sm" | "default" | "lg";
  fullWidth?: boolean;
  recipientName?: string;
}

export const ConnectionButton = ({
  status = "not_connected",
  userId,
  onConnect,
  size = "sm",
  fullWidth = true,
  recipientName = "User",
}: ConnectionButtonProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const baseClasses = fullWidth ? "w-full" : "";

  if (status === "accepted") {
    return (
      <Button
        size={size}
        variant="ghost"
        disabled
        className={`${baseClasses} text-success bg-success-subtle`}
      >
        Connected
      </Button>
    );
  }

  if (status === "pending") {
    return (
      <Button
        size={size}
        variant="ghost"
        disabled
        className={`${baseClasses} text-warning bg-warning-subtle`}
      >
        Pending
      </Button>
    );
  }

  if (status === "blocked") {
    return (
      <Button
        size={size}
        variant="ghost"
        disabled
        className={`${baseClasses} text-destructive bg-destructive/10`}
      >
        Unavailable
      </Button>
    );
  }

  // Default: Connect button
  return (
    <>
      <Button
        size={size}
        onClick={(e) => {
          e.stopPropagation();
          setShowDialog(true);
        }}
        className={`${baseClasses} bg-primary hover:bg-primary-hover text-primary-foreground`}
      >
        <UserPlus className="h-3 w-3 mr-1" />
        Connect
      </Button>

      <ConnectionMessageDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onConfirm={(message) => onConnect(userId, message)}
        recipientName={recipientName}
      />
    </>
  );
};

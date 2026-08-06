import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteConfirmDialogProps {
  /** Controls dialog visibility */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Dialog heading — defaults to "Are you sure?" */
  title?: string;
  /** Dialog body — defaults to "This action cannot be undone." */
  description?: string;
  /** Shows a spinner and disables buttons while the delete request is in-flight */
  isDeleting?: boolean;
  /** Called when the user clicks the red confirm button */
  onConfirm: () => void;
  /** Override the confirm button label — defaults to "Delete" */
  confirmLabel?: string;
}

/**
 * Reusable delete confirmation dialog.
 *
 * Usage:
 *   const { isDeleting, confirmOpen, setConfirmOpen, requestDelete, confirmDelete } = useDelete({ ... });
 *
 *   <button onClick={requestDelete}>Delete</button>
 *   <DeleteConfirmDialog
 *     open={confirmOpen}
 *     onOpenChange={setConfirmOpen}
 *     isDeleting={isDeleting}
 *     onConfirm={confirmDelete}
 *     title="Delete post?"
 *     description="Your post and all its comments will be permanently removed."
 *   />
 */
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  isDeleting = false,
  onConfirm,
  confirmLabel = "Delete",
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#0f0f1a] border border-white/10 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isDeleting}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault(); // prevent dialog auto-close — let onConfirm control it
              onConfirm();
            }}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white border-none focus:ring-red-600"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Deleting…
              </>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

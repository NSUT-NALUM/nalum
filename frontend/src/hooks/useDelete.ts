import { useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

interface UseDeleteOptions {
  /**
   * The API endpoint to call with DELETE, e.g. "/posts/abc123".
   * Can be a static string or a getter function if it's computed at call time.
   */
  endpoint: string;
  /** Called after a successful delete. Use to update local state (e.g. filter arrays). */
  onSuccess?: () => void;
  /** Toast message shown on success. Defaults to "Deleted successfully". */
  successMessage?: string;
  /** Toast message shown on error. The server message is used if available. */
  errorMessage?: string;
}

interface UseDeleteReturn {
  /** True while the DELETE request is in-flight. Use to disable buttons / show spinner. */
  isDeleting: boolean;
  /** Controls visibility of the <DeleteConfirmDialog />. */
  confirmOpen: boolean;
  setConfirmOpen: (open: boolean) => void;
  /** Call this when the user clicks a "Delete" button — opens the confirm dialog. */
  requestDelete: () => void;
  /** Call this from <DeleteConfirmDialog onConfirm={...}> — executes the API call. */
  confirmDelete: () => Promise<void>;
}

/**
 * Reusable hook that encapsulates the full delete lifecycle:
 *   1. User clicks delete → dialog opens (requestDelete)
 *   2. User confirms → API DELETE called, toast shown, onSuccess fired (confirmDelete)
 *   3. User cancels → dialog closes, no side effects
 *
 * Usage:
 *   const { isDeleting, confirmOpen, setConfirmOpen, requestDelete, confirmDelete } = useDelete({
 *     endpoint: `/posts/${post._id}`,
 *     onSuccess: () => setPosts((prev) => prev.filter((p) => p._id !== post._id)),
 *     successMessage: "Post deleted",
 *   });
 *
 *   <button onClick={requestDelete}>Delete</button>
 *   <DeleteConfirmDialog
 *     open={confirmOpen}
 *     onOpenChange={setConfirmOpen}
 *     isDeleting={isDeleting}
 *     onConfirm={confirmDelete}
 *   />
 */
export function useDelete({
  endpoint,
  onSuccess,
  successMessage = "Deleted successfully",
  errorMessage = "Failed to delete",
}: UseDeleteOptions): UseDeleteReturn {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const requestDelete = () => {
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(endpoint);
      toast.success(successMessage);
      setConfirmOpen(false);
      onSuccess?.();
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message;
      toast.error(serverMsg || errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    isDeleting,
    confirmOpen,
    setConfirmOpen,
    requestDelete,
    confirmDelete,
  };
}

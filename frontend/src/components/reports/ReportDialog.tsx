import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/api";
import { Flag } from "lucide-react";

interface ReportDialogProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  onReportSubmitted?: () => void;
}

const REPORT_REASONS = [
  "Spam",
  "Inappropriate Content",
  "Harassment or Hate Speech",
  "Misinformation",
  "Violence or Dangerous Content",
  "Copyright Violation",
  "Other",
];

const ReportDialog: React.FC<ReportDialogProps> = ({
  postId,
  isOpen,
  onClose,
  onReportSubmitted,
}) => {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason || !description) {
      toast.error("Please provide both reason and description");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post(`/reports/post/${postId}`, {
        reason,
        description,
      });

      toast.success("Post reported");
      onReportSubmitted?.();
      setReason("");
      setDescription("");
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setReason("");
      setDescription("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border text-foreground sm:max-w-[500px] rounded-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-headline-md text-foreground">
            <Flag className="h-5 w-5 text-destructive" />
            Report Post
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Let us know what's wrong with this post. Reports are reviewed by moderators.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-foreground">
              Reason
            </Label>
            <Select value={reason} onValueChange={setReason} disabled={isSubmitting}>
              <SelectTrigger id="reason" className="bg-background border-input text-foreground">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
              disabled={isSubmitting}
              placeholder="Please provide detailed information about why you're reporting this post..."
              className="bg-background border-input text-foreground placeholder:text-muted-foreground resize-none focus-visible:ring-ring"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim() || !description.trim()}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {isSubmitting ? "Reporting..." : "Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;

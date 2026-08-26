import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ConnectionMessageDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (message: string) => void;
    recipientName: string;
}


export const ConnectionMessageDialog = ({
    isOpen,
    onClose,
    onConfirm,
    recipientName,
}: ConnectionMessageDialogProps) => {
    const [message, setMessage] = useState("");

    // Set pre-written message when dialog opens
    useEffect(() => {
        if (isOpen) {
            setMessage(`Hi ${recipientName}, I'd like to connect with you!`);
        }
    }, [isOpen, recipientName]);

    const handleConfirm = () => {
        if (!message.trim()) return;
        onConfirm(message.trim());
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-card border-border text-foreground sm:max-w-md rounded-card">
                <DialogHeader>
                    <DialogTitle className="text-headline-md text-foreground">
                        Connect with {recipientName}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Send a message to introduce yourself.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Hi, I'd like to connect with you!"
                        className="min-h-[100px] bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                    />
                </div>
                <DialogFooter className="flex gap-2 justify-end">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!message.trim()}
                        className="bg-primary hover:bg-primary-hover text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Send Request
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

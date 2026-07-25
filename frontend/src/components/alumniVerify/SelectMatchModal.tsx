import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Match {
  name: string;
  roll_no: string;
  batch: string;
  branch: string;
}

interface SelectMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: Match[];
  onSelect: (match: Match) => void;
}

const SelectMatchModal = ({
  isOpen,
  onClose,
  matches,
  onSelect,
}: SelectMatchModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Your Profile</DialogTitle>
          <DialogDescription>
            We found multiple profiles matching your details. Please select the
            one that belongs to you.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {matches.map((match, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={() => onSelect(match)}
            >
              <div className="space-y-1">
                <p className="font-semibold text-lg">{match.name}</p>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    <span className="font-medium">Roll No:</span>{" "}
                    {match.roll_no}
                  </p>
                  <p>
                    <span className="font-medium">Batch:</span> {match.batch}
                  </p>
                  <p className="col-span-2">
                    <span className="font-medium">Branch:</span> {match.branch}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SelectMatchModal;

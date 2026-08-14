import { useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

export const MAX_TAGS = 5;
const MAX_TAG_LENGTH = 24;

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

// Free-form topic labels for a post. Mirrors the server's normalisation rules
// (trim, de-duplicate case-insensitively, cap at five) so a submission never
// silently loses a tag the author can still see on screen.
const TagInput = ({
  value,
  onChange,
  placeholder = "e.g., Research, Career…",
}: TagInputProps) => {
  const [draft, setDraft] = useState("");

  const addTag = () => {
    const tag = draft.trim().replace(/\s+/g, " ").slice(0, MAX_TAG_LENGTH);
    if (!tag) return;

    if (value.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
      setDraft("");
      return;
    }
    if (value.length >= MAX_TAGS) {
      toast.error(`You can add up to ${MAX_TAGS} tags`);
      return;
    }

    onChange([...value, tag]);
    setDraft("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={draft}
          maxLength={MAX_TAG_LENGTH}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              addTag();
            }
            if (event.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          placeholder={placeholder}
          className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-card px-3 text-body-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="button"
          onClick={addTag}
          disabled={!draft.trim()}
          aria-label="Add tag"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-input bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-input disabled:hover:text-muted-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <span key={tag} className="ap-chip ap-chip-primary">
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter((item) => item !== tag))}
                aria-label={`Remove ${tag}`}
                className="text-primary-subtle-foreground/70 transition-colors hover:text-primary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <p className="text-label-sm text-muted-foreground">
        {value.length}/{MAX_TAGS} tags used
      </p>
    </div>
  );
};

export default TagInput;

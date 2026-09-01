import { useRef, useState } from "react";
import { Bold, Italic, Underline, Strikethrough, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import MentionTextarea from "@/components/MentionTextarea";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const RichTextEditor = ({ value, onChange, placeholder = "What do you want to talk about?", minHeight = "200px" }: RichTextEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const insertFormatting = (before: string, after: string = before) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText =
      value.substring(0, start) +
      before +
      (selectedText || "text") +
      after +
      value.substring(end);

    onChange(newText);

    // Set cursor position after formatting
    setTimeout(() => {
      const newCursorPos = start + before.length + (selectedText ? selectedText.length : 4);
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertLink = () => {
    const textarea = textareaRef.current;
    if (!textarea || !linkUrl) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const linkText = selectedText || "link text";
    const newText =
      value.substring(0, start) +
      `[${linkText}](${linkUrl})` +
      value.substring(end);

    onChange(newText);
    setShowLinkDialog(false);
    setLinkUrl("");
    
    setTimeout(() => {
      textarea.focus();
    }, 0);
  };

  const formatButtons = [
    {
      icon: Bold,
      label: "Bold",
      action: () => insertFormatting("**"),
    },
    {
      icon: Italic,
      label: "Italic",
      action: () => insertFormatting("*"),
    },
    {
      icon: Underline,
      label: "Underline",
      action: () => insertFormatting("<u>", "</u>"),
    },
    {
      icon: Strikethrough,
      label: "Strikethrough",
      action: () => insertFormatting("~~"),
    },
    {
      icon: LinkIcon,
      label: "Link",
      action: () => setShowLinkDialog(true),
    },
  ];

  return (
    <div className="space-y-2">
      {/* Formatting Toolbar */}
      <div className="flex items-center gap-1 p-2 rounded-lg border bg-white/5 border-white/10">
        {formatButtons.map((button) => (
          <Button
            key={button.label}
            type="button"
            variant="ghost"
            size="sm"
            onClick={button.action}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10"
            title={button.label}
          >
            <button.icon className="h-4 w-4" />
          </Button>
        ))}
        
        <div className="ml-auto text-xs text-gray-500">
          <span className="hidden sm:inline">Tip: First line appears as title</span>
        </div>
      </div>

      {/* Text Area */}
      <MentionTextarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        placeholder={`${placeholder} — type @ to mention someone`}
        className={cn(
          "font-normal text-base leading-relaxed focus:ring-2 focus:ring-blue-500/20"
        )}
        style={{ minHeight }}
      />

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="p-3 rounded-lg border space-y-2 bg-white/5 border-white/10">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Enter URL (https://...)"
            className="w-full px-3 py-2 border rounded focus:outline-none bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500/20"
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={insertLink}
              disabled={!linkUrl}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Insert Link
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowLinkDialog(false);
                setLinkUrl("");
              }}
              className="text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Formatting Help */}
      <div className="text-xs space-y-1 text-gray-500">
        <p className="font-medium text-gray-400">Formatting tips:</p>
        <div className="grid grid-cols-2 gap-2">
          <span>**bold** or <span className="font-bold">bold</span></span>
          <span>*italic* or <span className="italic">italic</span></span>
          <span>&lt;u&gt;underline&lt;/u&gt;</span>
          <span>~~strikethrough~~</span>
          <span className="col-span-2">[link text](url) for hyperlinks</span>
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;

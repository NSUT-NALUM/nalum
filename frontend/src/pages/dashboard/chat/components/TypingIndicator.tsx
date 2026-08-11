import { useChatContext } from "@/context/ChatContext";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";

interface TypingIndicatorProps {
  conversationId: string;
}

/**
 * TypingIndicator Component
 * 
 * Displays an animated bubble when another user in the conversation is typing.
 * Listens to socket events via the useTypingIndicator hook.
 */
export const TypingIndicator = ({ conversationId }: TypingIndicatorProps) => {
  const { socket } = useChatContext();
  const { typingUsers } = useTypingIndicator(socket, conversationId);

  if (typingUsers.length === 0) return null;

  return (
    <div className="px-4 py-2">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 shadow-sm animate-in fade-in slide-in-from-bottom-1">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
        <span className="text-[10px] text-gray-400 font-medium">Typing...</span>
      </div>
    </div>
  );
};

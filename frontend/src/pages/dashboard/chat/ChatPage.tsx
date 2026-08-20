import { useState, useEffect, useMemo } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";

import { ChatList } from "./components/ChatList";
import { ChatWindow } from "./components/ChatWindow";

import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

import { useMergedChats } from "@/hooks/useMergedChats";

/**
 * ChatPageContent Component
 * 
 * Main layout for the chat dashboard.
 *
 * Structure:
 * - Left Sidebar: Tabs for ChatList, ConnectionRequests, and UserSearch.
 * - Right Area: ChatWindow (active conversation) or placeholder.
 */
const ChatPageContent = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { allChats } = useMergedChats();

  const selectedConversation = useMemo(() =>
    allChats.find((c: any) => c._id === conversationId) || null,
    [allChats, conversationId]
  );

  useEffect(() => {
    if (location.state?.conversation) {
      // If passing a conversation object, navigate to its URL
      const conv = location.state.conversation;
      if (conv._id && conv._id !== conversationId) {
        navigate(`/dashboard/chat/${conv._id}`, { replace: true });
      }

      // Clear state so it doesn't persist if we navigate away and back without intent
      window.history.replaceState({}, document.title);
    }
  }, [location.state, conversationId, navigate]);


  return (
    <div className="h-full md:h-full p-0 md:p-6 lg:p-8 bg-background">
      <div className="h-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-4 h-full">
          {/* Left Sidebar */}
          {/* Hidden on mobile when a conversation is selected to show the chat window */}
          <div className={`${selectedConversation ? "hidden md:block" : "block"} md:col-span-1 h-full min-h-0`}>
            <div className="h-full flex flex-col bg-card md:border border-border shadow-card md:rounded-card overflow-hidden">
              <div className="h-full flex flex-col">
                <div className="flex-1 mt-0 overflow-hidden min-h-0">
                  <ChatList
                    onSelectConversation={(chat: any) => navigate(`/dashboard/chat/${chat._id}`)}
                    selectedConversation={selectedConversation}
                    chats={allChats}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Area - Chat Window */}
          <div className={`${selectedConversation ? "block" : "hidden md:block"} md:col-span-2 h-full min-h-0`}>
            <div className="h-full flex flex-col bg-card md:border border-border shadow-card md:rounded-card overflow-hidden relative">
              {selectedConversation ? (
                <ChatWindow
                  conversation={selectedConversation}
                  onBack={() => navigate("/dashboard/chat")}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground p-8">
                    <div className="h-20 w-20 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center border border-border">
                      <MessageSquare className="h-10 w-10 text-primary/30" />
                    </div>
                    <p className="text-xl font-medium mb-2 text-foreground">Select a conversation</p>
                    <p className="text-sm text-muted-foreground">Choose a conversation from the list to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ChatPage = () => {
  return (
    <ChatPageContent />
  );
};

"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChatMessage } from "@/hooks/use-chat";

interface ChatConversationProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (body: string) => void;
  isSending: boolean;
  disabled?: boolean;
}

export function ChatConversation({
  messages,
  isLoading,
  onSendMessage,
  isSending,
  disabled,
}: ChatConversationProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Loading messages...
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No messages yet. Start the conversation.
          </div>
        )}
        {messages.map((msg) => {
          const isAgent = msg.senderType === "agent";
          return (
            <div
              key={msg.id}
              className={cn(
                "flex",
                isAgent ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[70%] rounded-lg px-4 py-2 text-sm",
                  isAgent
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                <p className="whitespace-pre-wrap">{msg.body}</p>
                <p
                  className={cn(
                    "mt-1 text-xs",
                    isAgent
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground",
                  )}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder={disabled ? "Select a conversation..." : "Type a message..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isSending}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={disabled || isSending || !input.trim()}
            size="sm"
          >
            {isSending ? "Sending..." : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}

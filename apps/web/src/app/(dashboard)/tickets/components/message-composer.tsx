"use client";

import { useState } from "react";
import { Send, StickyNote, MessageSquare, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MessageComposerProps {
  onSend: (data: {
    bodyHtml: string;
    type: "reply" | "note";
  }) => Promise<void>;
  isLoading?: boolean;
}

export function MessageComposer({ onSend, isLoading }: MessageComposerProps) {
  const [body, setBody] = useState("");
  const [mode, setMode] = useState<"reply" | "note">("reply");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    await onSend({
      bodyHtml: body,
      type: mode,
    });
    setBody("");
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-border">
      {/* Mode tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setMode("reply")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors",
            mode === "reply"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <MessageSquare className="h-4 w-4" />
          Reply
        </button>
        <button
          type="button"
          onClick={() => setMode("note")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors",
            mode === "note"
              ? "border-b-2 border-amber-500 text-amber-600"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <StickyNote className="h-4 w-4" />
          Internal Note
        </button>
      </div>

      {/* Composer body */}
      <div
        className={cn(
          "p-3",
          mode === "note" && "bg-amber-50/50 dark:bg-amber-950/10",
        )}
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            mode === "reply"
              ? "Type your reply..."
              : "Add an internal note (not visible to contact)..."
          }
          rows={4}
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" disabled>
              <Paperclip className="mr-1 h-4 w-4" />
              Attach
            </Button>
          </div>

          <Button
            type="submit"
            size="sm"
            disabled={isLoading || !body.trim()}
            className={cn(
              mode === "note" &&
                "bg-amber-500 hover:bg-amber-600 text-white",
            )}
          >
            <Send className="mr-1 h-4 w-4" />
            {isLoading
              ? "Sending..."
              : mode === "reply"
                ? "Send Reply"
                : "Add Note"}
          </Button>
        </div>
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  useChatSessions,
  useChatMessages,
  useSendMessage,
  useAssignChat,
  useEndChat,
  useConvertToTicket,
} from "@/hooks/use-chat";
import type { ChatSession } from "@/hooks/use-chat";
import { ChatConversation } from "./components/chat-conversation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function SetupInstructions() {
  const [showWidget, setShowWidget] = useState(false);

  const widgetSnippet = `<script src="${typeof window !== "undefined" ? window.location.origin : "https://your-crm.com"}/widget.js" data-tenant-id="YOUR_TENANT_ID"></script>`;

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">How to receive chats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          Chat sessions can be created in two ways:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Embed the chat widget</span> on your website
            to let visitors start conversations.
          </li>
          <li>
            <span className="font-medium text-foreground">Use the API</span> to create sessions
            programmatically for testing or integrations.
          </li>
        </ol>
        <div className="rounded-md bg-muted p-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            API Endpoint
          </p>
          <code className="text-xs">
            POST {API_URL}/api/v1/service/chat/sessions
          </code>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowWidget(!showWidget)}
          >
            {showWidget ? "Hide Widget Code" : "Get Widget Code"}
          </Button>
          {showWidget && (
            <div className="mt-2 rounded-md bg-muted p-3">
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Add this snippet to your website (placeholder -- widget coming soon)
              </p>
              <pre className="overflow-x-auto text-xs whitespace-pre-wrap break-all">
                {widgetSnippet}
              </pre>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => navigator.clipboard.writeText(widgetSnippet)}
              >
                Copy to clipboard
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ChatPage() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );

  const { data: sessions, isLoading: sessionsLoading } = useChatSessions();
  const { data: messages, isLoading: messagesLoading } =
    useChatMessages(selectedSessionId);
  const sendMessage = useSendMessage();
  const assignChat = useAssignChat();
  const endChat = useEndChat();
  const convertToTicket = useConvertToTicket();

  const selectedSession = sessions?.find((s) => s.id === selectedSessionId);

  const handleSendMessage = (body: string) => {
    if (!selectedSessionId) return;
    sendMessage.mutate({ sessionId: selectedSessionId, body });
  };

  const handleAssign = (sessionId: string) => {
    assignChat.mutate(sessionId);
  };

  const handleEndChat = () => {
    if (!selectedSessionId) return;
    endChat.mutate(selectedSessionId, {
      onSuccess: () => setSelectedSessionId(null),
    });
  };

  const handleConvertToTicket = () => {
    if (!selectedSessionId) return;
    convertToTicket.mutate({ sessionId: selectedSessionId });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "waiting":
        return <Badge variant="secondary">Waiting</Badge>;
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "ended":
        return <Badge variant="outline">Ended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLastMessagePreview = (session: ChatSession) => {
    // We only have metadata from the session list; show channel info as fallback
    return session.metadata?.lastMessage ?? "New conversation";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chat</h1>
        <p className="text-muted-foreground">
          Live chat inbox. Manage conversations with contacts in real time.
        </p>
      </div>

      <div className="flex gap-4" style={{ height: "calc(100vh - 220px)" }}>
        {/* Left panel: Session list */}
        <Card className="w-80 shrink-0 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Conversations</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {sessionsLoading && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading sessions...
              </div>
            )}
            {!sessionsLoading && (!sessions || sessions.length === 0) && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No active conversations. See setup instructions to start receiving chats.
              </div>
            )}
            {sessions?.map((session) => (
              <button
                key={session.id}
                onClick={() => setSelectedSessionId(session.id)}
                className={cn(
                  "w-full border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted/50",
                  selectedSessionId === session.id && "bg-muted",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">
                    {session.contactId
                      ? `Contact ${session.contactId.slice(0, 8)}...`
                      : "Anonymous Visitor"}
                  </span>
                  {getStatusBadge(session.status)}
                </div>
                <p className="mt-1 text-xs text-muted-foreground truncate">
                  {getLastMessagePreview(session)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(session.startedAt).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Right panel: Conversation */}
        <Card className="flex-1 flex flex-col">
          {selectedSession ? (
            <>
              {/* Conversation header */}
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">
                      {selectedSession.contactId
                        ? `Contact ${selectedSession.contactId.slice(0, 8)}...`
                        : "Anonymous Visitor"}
                    </CardTitle>
                    {getStatusBadge(selectedSession.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedSession.status === "waiting" && (
                      <Button
                        size="sm"
                        onClick={() => handleAssign(selectedSession.id)}
                        disabled={assignChat.isPending}
                      >
                        {assignChat.isPending
                          ? "Assigning..."
                          : "Assign to me"}
                      </Button>
                    )}
                    {selectedSession.status !== "ended" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleConvertToTicket}
                          disabled={
                            convertToTicket.isPending ||
                            !!selectedSession.ticketId
                          }
                        >
                          {selectedSession.ticketId
                            ? "Ticket created"
                            : convertToTicket.isPending
                              ? "Converting..."
                              : "Convert to ticket"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleEndChat}
                          disabled={endChat.isPending}
                        >
                          {endChat.isPending ? "Ending..." : "End chat"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <ChatConversation
                messages={messages ?? []}
                isLoading={messagesLoading}
                onSendMessage={handleSendMessage}
                isSending={sendMessage.isPending}
                disabled={selectedSession.status === "ended"}
              />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
              {(!sessions || sessions.length === 0) ? (
                <SetupInstructions />
              ) : (
                <p className="text-muted-foreground">
                  Select a conversation to start chatting.
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

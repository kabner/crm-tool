"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Clock,
  Tag,
  X,
  CheckCircle2,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useTicket,
  useUpdateTicket,
  useAddTicketMessage,
  useAssignTicket,
  useCloseTicket,
} from "@/hooks/use-tickets";
import { MessageComposer } from "../components/message-composer";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = ["new", "open", "pending", "resolved", "closed"];
const PRIORITY_OPTIONS = ["low", "normal", "high", "urgent"];

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  open: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  resolved:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  normal: "bg-blue-100 text-blue-800",
  low: "bg-gray-100 text-gray-600",
};

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: ticket, isLoading } = useTicket(id);
  const updateTicket = useUpdateTicket();
  const addMessage = useAddTicketMessage();
  const assignTicket = useAssignTicket();
  const closeTicket = useCloseTicket();

  const [assigneeInput, setAssigneeInput] = useState("");
  const [showAssignInput, setShowAssignInput] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const handleSendMessage = async (data: {
    bodyHtml: string;
    type: "reply" | "note";
  }) => {
    await addMessage.mutateAsync({
      ticketId: id,
      data: {
        bodyHtml: data.bodyHtml,
        type: data.type,
        direction: data.type === "note" ? "internal" : "outbound",
      },
    });
  };

  const handleStatusChange = async (status: string) => {
    await updateTicket.mutateAsync({ id, data: { status } });
  };

  const handlePriorityChange = async (priority: string) => {
    await updateTicket.mutateAsync({ id, data: { priority } });
  };

  const handleAssign = async () => {
    if (!assigneeInput.trim()) return;
    await assignTicket.mutateAsync({ ticketId: id, userId: assigneeInput });
    setAssigneeInput("");
    setShowAssignInput(false);
  };

  const handleClose = async () => {
    await closeTicket.mutateAsync(id);
  };

  const handleAddTag = async () => {
    if (!tagInput.trim() || !ticket) return;
    const newTags = [...(ticket.tags || []), tagInput.trim()];
    await updateTicket.mutateAsync({ id, data: { tags: newTags } });
    setTagInput("");
  };

  const handleRemoveTag = async (tag: string) => {
    if (!ticket) return;
    const newTags = ticket.tags.filter((t) => t !== tag);
    await updateTicket.mutateAsync({ id, data: { tags: newTags } });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/tickets")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tickets
        </Button>
        <p className="text-muted-foreground">Ticket not found.</p>
      </div>
    );
  }

  const messages = ticket.messages ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/tickets")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">
                {ticket.number}
              </span>
              <Badge
                className={cn(
                  "capitalize",
                  STATUS_COLORS[ticket.status] ?? "",
                )}
                variant="secondary"
              >
                {ticket.status}
              </Badge>
              <Badge
                className={cn(
                  "capitalize",
                  PRIORITY_COLORS[ticket.priority] ?? "",
                )}
                variant="secondary"
              >
                {ticket.priority}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {ticket.subject}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ticket.status !== "closed" && (
            <Button variant="outline" size="sm" onClick={handleClose}>
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Close
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Conversation thread */}
        <div className="lg:col-span-2 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle className="text-base">Conversation</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-4 overflow-y-auto max-h-[500px]">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No messages yet.
                </p>
              ) : (
                messages.map((msg) => {
                  const isNote = msg.type === "note";
                  const isSystem = msg.direction === "system";
                  const isInbound = msg.fromContact;

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "rounded-lg border p-4",
                        isNote
                          ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
                          : isSystem
                            ? "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
                            : isInbound
                              ? "border-border bg-card"
                              : "border-primary/20 bg-primary/5",
                      )}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">
                            {isNote
                              ? "Internal Note"
                              : isInbound
                                ? "Contact"
                                : "Agent"}
                          </span>
                          {isNote && (
                            <Badge
                              variant="outline"
                              className="text-amber-600 border-amber-300"
                            >
                              Note
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none text-sm"
                        dangerouslySetInnerHTML={{ __html: msg.bodyHtml }}
                      />
                    </div>
                  );
                })
              )}
            </CardContent>

            {/* Reply composer */}
            {ticket.status !== "closed" && (
              <MessageComposer
                onSend={handleSendMessage}
                isLoading={addMessage.isPending}
              />
            )}
          </Card>
        </div>

        {/* Right sidebar: Ticket properties */}
        <div className="space-y-4">
          {/* Properties */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Status
                </label>
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Priority
                </label>
                <select
                  value={ticket.priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignee */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Assigned To
                </label>
                {ticket.assignedTo ? (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-mono truncate">
                      {ticket.assignedTo}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Unassigned</p>
                )}
                {showAssignInput ? (
                  <div className="flex gap-2">
                    <Input
                      value={assigneeInput}
                      onChange={(e) => setAssigneeInput(e.target.value)}
                      placeholder="User ID"
                      className="h-8 text-sm"
                    />
                    <Button size="sm" onClick={handleAssign}>
                      Assign
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowAssignInput(true)}
                  >
                    <UserPlus className="mr-1 h-3 w-3" />
                    {ticket.assignedTo ? "Reassign" : "Assign"}
                  </Button>
                )}
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Category
                </label>
                <p className="text-sm">
                  {ticket.category?.name ?? "Uncategorized"}
                </p>
              </div>

              {/* Channel */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Channel
                </label>
                <p className="text-sm capitalize">{ticket.channel}</p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-mono text-muted-foreground">
                {ticket.contactId}
              </p>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ticket.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {ticket.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="gap-1"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tag"
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button size="sm" variant="outline" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* SLA Timer placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">SLA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    First Response Due
                  </p>
                  <p className="text-sm">
                    {ticket.slaFirstResponseDue
                      ? new Date(ticket.slaFirstResponseDue).toLocaleString()
                      : "--"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Resolution Due
                  </p>
                  <p className="text-sm">
                    {ticket.slaResolutionDue
                      ? new Date(ticket.slaResolutionDue).toLocaleString()
                      : "--"}
                  </p>
                </div>
              </div>
              {ticket.slaBreached && (
                <Badge variant="destructive">SLA Breached</Badge>
              )}
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Created: </span>
                {new Date(ticket.createdAt).toLocaleString()}
              </div>
              {ticket.firstResponseAt && (
                <div>
                  <span className="text-muted-foreground">
                    First Response:{" "}
                  </span>
                  {new Date(ticket.firstResponseAt).toLocaleString()}
                </div>
              )}
              {ticket.resolvedAt && (
                <div>
                  <span className="text-muted-foreground">Resolved: </span>
                  {new Date(ticket.resolvedAt).toLocaleString()}
                </div>
              )}
              {ticket.closedAt && (
                <div>
                  <span className="text-muted-foreground">Closed: </span>
                  {new Date(ticket.closedAt).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

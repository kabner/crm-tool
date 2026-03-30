"use client";

import { useState } from "react";
import { X, Send, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useSendEmail } from "@/hooks/use-emails";
import { useLists, type ListItem } from "@/hooks/use-lists";
import { EntitySearch } from "@/components/entity-search";

interface SendDialogProps {
  emailId: string;
  onClose: () => void;
  onSent: () => void;
}

export function SendDialog({ emailId, onClose, onSent }: SendDialogProps) {
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [contactIdsInput, setContactIdsInput] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<{ id: string; label: string }[]>([]);
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  const sendEmail = useSendEmail();
  const { data: listsData, isLoading: listsLoading } = useLists({ limit: 100 });
  const lists = listsData?.data ?? [];

  const toggleList = (listId: string) => {
    setSelectedListIds((prev) =>
      prev.includes(listId) ? prev.filter((id) => id !== listId) : [...prev, listId],
    );
  };

  const recipientEstimate = selectedListIds.reduce((sum, id) => {
    const list = lists.find((l) => l.id === id);
    return sum + (list?.memberCount ?? 0);
  }, 0);

  const contactIds = selectedContacts.map((c) => c.id);

  const totalRecipients = recipientEstimate + contactIds.length;

  const handleSend = async () => {
    const data: {
      listIds?: string[];
      contactIds?: string[];
      scheduledAt?: string;
    } = {};

    if (selectedListIds.length > 0) data.listIds = selectedListIds;
    if (contactIds.length > 0) data.contactIds = contactIds;
    if (scheduleMode === "later" && scheduledDate && scheduledTime) {
      data.scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
    }

    await sendEmail.mutateAsync({ id: emailId, data });
    onSent();
  };

  const canSend =
    (selectedListIds.length > 0 || contactIds.length > 0) &&
    (scheduleMode === "now" || (scheduledDate && scheduledTime));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-lg">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold">Send Email</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-4">
          {/* Select lists */}
          <div>
            <Label>Send to Lists</Label>
            {listsLoading ? (
              <p className="mt-1 text-sm text-muted-foreground">Loading lists...</p>
            ) : lists.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">No lists available.</p>
            ) : (
              <div className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                {lists.map((list: ListItem) => (
                  <label
                    key={list.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={selectedListIds.includes(list.id)}
                      onChange={() => toggleList(list.id)}
                      className="rounded border-border"
                    />
                    <span className="flex-1">{list.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {list.memberCount} contacts
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Specific contacts */}
          <div>
            <Label>Or Send to Specific Contacts</Label>
            <EntitySearch
              entityType="contact"
              value=""
              onChange={(id, entity) => {
                if (id && !selectedContacts.some((c) => c.id === id)) {
                  setSelectedContacts((prev) => [
                    ...prev,
                    { id, label: entity?.label || id },
                  ]);
                }
              }}
              placeholder="Search contacts to add..."
              className="mt-1"
            />
            {selectedContacts.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedContacts.map((contact) => (
                  <span
                    key={contact.id}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm"
                  >
                    {contact.label}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedContacts((prev) =>
                          prev.filter((c) => c.id !== contact.id),
                        )
                      }
                      className="ml-1 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Schedule toggle */}
          <div>
            <Label>When to Send</Label>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setScheduleMode("now")}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  scheduleMode === "now"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <Send className="h-4 w-4" />
                Send Now
              </button>
              <button
                onClick={() => setScheduleMode("later")}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  scheduleMode === "later"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <Clock className="h-4 w-4" />
                Schedule for Later
              </button>
            </div>

            {scheduleMode === "later" && (
              <div className="mt-3 flex gap-3">
                <div className="flex-1">
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs">Time</Label>
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Recipient estimate */}
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-sm">
              <span className="font-medium">Estimated recipients:</span>{" "}
              <span className="text-lg font-bold">
                {totalRecipients.toLocaleString()}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border p-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!canSend || sendEmail.isPending}
          >
            {sendEmail.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {scheduleMode === "later" ? "Schedule" : "Send Now"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

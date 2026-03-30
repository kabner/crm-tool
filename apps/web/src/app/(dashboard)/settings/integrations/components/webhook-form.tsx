"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as Checkbox from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

const AVAILABLE_EVENTS = [
  { value: "contact.created", label: "Contact Created" },
  { value: "contact.updated", label: "Contact Updated" },
  { value: "contact.deleted", label: "Contact Deleted" },
  { value: "company.created", label: "Company Created" },
  { value: "company.updated", label: "Company Updated" },
  { value: "deal.created", label: "Deal Created" },
  { value: "deal.stage_changed", label: "Deal Stage Changed" },
  { value: "deal.won", label: "Deal Won" },
  { value: "deal.lost", label: "Deal Lost" },
  { value: "ticket.created", label: "Ticket Created" },
  { value: "ticket.resolved", label: "Ticket Resolved" },
  { value: "invoice.paid", label: "Invoice Paid" },
  { value: "invoice.overdue", label: "Invoice Overdue" },
];

interface WebhookFormProps {
  initialValues?: {
    url: string;
    events: string[];
  };
  onSubmit: (data: { url: string; events: string[] }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function WebhookForm({
  initialValues,
  onSubmit,
  onCancel,
  isLoading,
}: WebhookFormProps) {
  const [url, setUrl] = useState(initialValues?.url ?? "");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(
    initialValues?.events ?? [],
  );

  const toggleEvent = (eventValue: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventValue)
        ? prev.filter((e) => e !== eventValue)
        : [...prev, eventValue],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || selectedEvents.length === 0) return;
    onSubmit({ url, events: selectedEvents });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>
            {initialValues ? "Edit Webhook" : "Create Webhook"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Endpoint URL</Label>
            <Input
              id="webhook-url"
              type="url"
              placeholder="https://example.com/webhooks"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Event Types</Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {AVAILABLE_EVENTS.map((event) => (
                <label
                  key={event.value}
                  className="flex items-center gap-2 rounded-md border border-border p-2 text-sm hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox.Root
                    className="flex h-4 w-4 items-center justify-center rounded border border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    checked={selectedEvents.includes(event.value)}
                    onCheckedChange={() => toggleEvent(event.value)}
                  >
                    <Checkbox.Indicator>
                      <Check className="h-3 w-3" />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <span>{event.label}</span>
                </label>
              ))}
            </div>
            {selectedEvents.length === 0 && (
              <p className="text-xs text-destructive">
                Select at least one event type
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !url || selectedEvents.length === 0}
            >
              {isLoading
                ? "Saving..."
                : initialValues
                  ? "Update Webhook"
                  : "Create Webhook"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

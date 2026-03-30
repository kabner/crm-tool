"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EntitySearch } from "@/components/entity-search";

interface TicketFormProps {
  onSubmit: (data: {
    subject: string;
    contactId: string;
    priority?: string;
    categoryId?: string;
    initialMessage?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export function TicketForm({ onSubmit, isLoading }: TicketFormProps) {
  const [subject, setSubject] = useState("");
  const [contactId, setContactId] = useState("");
  const [priority, setPriority] = useState("normal");
  const [initialMessage, setInitialMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      subject,
      contactId,
      priority,
      initialMessage: initialMessage || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          placeholder="Brief description of the issue"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactId">Contact</Label>
        <EntitySearch
          entityType="contact"
          value={contactId}
          onChange={(id) => setContactId(id)}
          placeholder="Search contacts..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <select
          id="priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="initialMessage">Initial Message</Label>
        <textarea
          id="initialMessage"
          placeholder="Describe the issue in detail..."
          value={initialMessage}
          onChange={(e) => setInitialMessage(e.target.value)}
          rows={4}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      <Button type="submit" disabled={isLoading || !subject || !contactId}>
        {isLoading ? "Creating..." : "Create Ticket"}
      </Button>
    </form>
  );
}

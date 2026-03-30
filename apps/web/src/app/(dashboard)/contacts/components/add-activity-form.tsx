"use client";

import { useState } from "react";
import {
  PenLine,
  CheckSquare,
  Phone,
  Mail,
  Calendar,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateActivity } from "@/hooks/use-activities";

type ActivityType = "note" | "task" | "call" | "email" | "meeting";

const activityTypes: {
  value: ActivityType;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "note", label: "Note", icon: PenLine },
  { value: "task", label: "Task", icon: CheckSquare },
  { value: "call", label: "Call", icon: Phone },
  { value: "email", label: "Email", icon: Mail },
  { value: "meeting", label: "Meeting", icon: Calendar },
];

const callOutcomes = [
  { value: "connected", label: "Connected" },
  { value: "left_voicemail", label: "Left Voicemail" },
  { value: "no_answer", label: "No Answer" },
];

interface AddActivityFormProps {
  contactId: string;
  companyId?: string;
  dealId?: string;
  onSuccess?: () => void;
}

export function AddActivityForm({
  contactId,
  companyId,
  dealId,
  onSuccess,
}: AddActivityFormProps) {
  const [type, setType] = useState<ActivityType>("note");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [callDuration, setCallDuration] = useState("");
  const [callOutcome, setCallOutcome] = useState("connected");

  const createActivity = useCreateActivity();

  function resetForm() {
    setSubject("");
    setBody("");
    setDueDate("");
    setCallDuration("");
    setCallOutcome("connected");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const metadata: Record<string, unknown> = {};
    if (type === "call") {
      if (callDuration) metadata.duration = Number(callDuration);
      metadata.outcome = callOutcome;
    }

    await createActivity.mutateAsync({
      type,
      subject,
      body: body || undefined,
      contactId,
      companyId: companyId || undefined,
      dealId: dealId || undefined,
      dueDate: dueDate || undefined,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    });

    resetForm();
    onSuccess?.();
  }

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector */}
          <div className="flex gap-1">
            {activityTypes.map((at) => {
              const Icon = at.icon;
              const isActive = type === at.value;
              return (
                <Button
                  key={at.value}
                  type="button"
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setType(at.value)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {at.label}
                </Button>
              );
            })}
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label htmlFor="activity-subject">Subject</Label>
            <Input
              id="activity-subject"
              placeholder={`${type.charAt(0).toUpperCase() + type.slice(1)} subject...`}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <Label htmlFor="activity-body">
              {type === "call" ? "Call Notes" : "Details"}
            </Label>
            <textarea
              id="activity-body"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={
                type === "call"
                  ? "Notes from the call..."
                  : "Add more details..."
              }
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          {/* Due date for task and meeting */}
          {(type === "task" || type === "meeting") && (
            <div className="space-y-1.5">
              <Label htmlFor="activity-due-date">
                {type === "task" ? "Due Date" : "Meeting Date"}
              </Label>
              <Input
                id="activity-due-date"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          )}

          {/* Call-specific fields */}
          {type === "call" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="call-duration">Duration (minutes)</Label>
                <Input
                  id="call-duration"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={callDuration}
                  onChange={(e) => setCallDuration(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="call-outcome">Outcome</Label>
                <select
                  id="call-outcome"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={callOutcome}
                  onChange={(e) => setCallOutcome(e.target.value)}
                >
                  {callOutcomes.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                resetForm();
                onSuccess?.();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!subject.trim() || createActivity.isPending}
            >
              {createActivity.isPending && (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              )}
              Log {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          </div>

          {createActivity.isError && (
            <p className="text-sm text-destructive">
              {createActivity.error.message}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

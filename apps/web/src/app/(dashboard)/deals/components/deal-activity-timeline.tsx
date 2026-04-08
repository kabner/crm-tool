"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MentionInput } from "@/components/mention-input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useDealActivities,
  useCreateActivity,
  useCompleteActivity,
} from "@/hooks/use-activities";
import {
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  CheckSquare,
  Clock,
  Plus,
  Check,
  Repeat,
} from "lucide-react";
import { SubtaskToggle } from "@/components/subtask-list";
import { renderMentions } from "@/lib/render-mentions";

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  call: Phone,
  email: Mail,
  note: MessageSquare,
  meeting: Calendar,
  task: CheckSquare,
};

const ACTIVITY_COLORS: Record<string, string> = {
  call: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  email: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  note: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
  meeting: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  task: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
};

interface DealActivityTimelineProps {
  dealId: string;
  compact?: boolean;
}

export function DealActivityTimeline({ dealId, compact = false }: DealActivityTimelineProps) {
  const { data, isLoading } = useDealActivities(dealId);
  const createActivity = useCreateActivity();
  const completeActivity = useCompleteActivity();
  const [showForm, setShowForm] = useState(false);
  const [newType, setNewType] = useState("note");
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");

  const handleCreate = async () => {
    if (!newSubject.trim()) return;
    await createActivity.mutateAsync({
      type: newType,
      subject: newSubject,
      body: newBody || undefined,
      dealId,
    });
    setNewSubject("");
    setNewBody("");
    setShowForm(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const activities = data?.data ?? [];

  return (
    <div className="space-y-3">
      {!showForm ? (
        <Button variant="outline" size="sm" className="w-full" onClick={() => setShowForm(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Log Activity
        </Button>
      ) : (
        <div className="space-y-2 rounded-md border border-border p-3">
          <div className="flex gap-2">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="flex h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="note">Note</option>
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting</option>
              <option value="task">Task</option>
            </select>
            <Input
              placeholder="Subject"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="h-8 text-sm"
              onKeyDown={(e) => e.key === "Enter" && !newBody && handleCreate()}
            />
          </div>
          <MentionInput
            placeholder="Add details or notes... Use @ to mention teammates"
            value={newBody}
            onChange={setNewBody}
            className="min-h-[60px] text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setNewSubject(""); setNewBody(""); }}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={!newSubject.trim() || createActivity.isPending}>
              Save
            </Button>
          </div>
        </div>
      )}

      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No activities yet</p>
      ) : (
        <div className="space-y-1">
          {activities.slice(0, compact ? 5 : undefined).map((activity) => {
            const Icon = ACTIVITY_ICONS[activity.type] ?? Clock;
            const colorClass = ACTIVITY_COLORS[activity.type] ?? "bg-muted text-muted-foreground";
            const isTask = activity.type === "task";
            const isCompleted = !!activity.completedAt;

            return (
              <div key={activity.id}>
                <div className="flex gap-3 rounded-md px-2 py-2 hover:bg-muted/50 transition-colors">
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", colorClass)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={cn("text-sm", isTask && isCompleted && "line-through text-muted-foreground")}>
                        {activity.subject}
                      </p>
                      {activity.recurrenceRule && (
                        <span
                          className="inline-flex items-center text-muted-foreground"
                          title={`Repeats ${activity.recurrenceRule}`}
                        >
                          <Repeat className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : "System"}{" "}
                      · {new Date(activity.createdAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                      })}
                    </p>
                    {activity.body && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {renderMentions(activity.body)}
                      </p>
                    )}
                    {isTask && (
                      <SubtaskToggle activity={activity} dealId={dealId} />
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isTask && !isCompleted && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => completeActivity.mutate(activity.id)}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {compact && activities.length > 5 && (
            <p className="text-xs text-muted-foreground text-center pt-1">
              +{activities.length - 5} more activities
            </p>
          )}
        </div>
      )}
    </div>
  );
}

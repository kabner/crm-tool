"use client";

import { useState } from "react";
import {
  PenLine,
  CheckSquare,
  Phone,
  Mail,
  Calendar,
  Plus,
  Check,
  Trash2,
  Repeat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompleteTask, useDeleteActivity } from "@/hooks/use-activities";
import type { Activity } from "@/hooks/use-activities";
import { AddActivityForm } from "./add-activity-form";
import { SubtaskToggle } from "@/components/subtask-list";

const typeIcons: Record<string, React.ElementType> = {
  note: PenLine,
  task: CheckSquare,
  call: Phone,
  email: Mail,
  meeting: Calendar,
};

const typeLabels: Record<string, string> = {
  note: "Note",
  task: "Task",
  call: "Call",
  email: "Email",
  meeting: "Meeting",
};

const typeColors: Record<string, string> = {
  note: "bg-blue-100 text-blue-700",
  task: "bg-amber-100 text-amber-700",
  call: "bg-green-100 text-green-700",
  email: "bg-purple-100 text-purple-700",
  meeting: "bg-rose-100 text-rose-700",
};

function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function getUserName(activity: Activity): string {
  if (activity.user) {
    return `${activity.user.firstName} ${activity.user.lastName}`;
  }
  return "Unknown user";
}

interface ActivityTimelineProps {
  contactId: string;
  activities: Activity[];
  isLoading: boolean;
}

export function ActivityTimeline({
  contactId,
  activities,
  isLoading,
}: ActivityTimelineProps) {
  const [showForm, setShowForm] = useState(false);
  const completeTask = useCompleteTask();
  const deleteActivity = useDeleteActivity();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Activity</h3>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Activity</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add Activity
        </Button>
      </div>

      {showForm && (
        <AddActivityForm
          contactId={contactId}
          onSuccess={() => setShowForm(false)}
        />
      )}

      {activities.length === 0 && !showForm && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No activities yet. Add one to get started.
        </p>
      )}

      <div className="relative space-y-0">
        {activities.map((activity, index) => {
          const Icon = typeIcons[activity.type] ?? PenLine;
          const isTask = activity.type === "task";
          const isCompleted = !!activity.completedAt;

          return (
            <div key={activity.id} className="relative flex gap-3 pb-6">
              {/* Timeline connector line */}
              {index < activities.length - 1 && (
                <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />
              )}

              {/* Icon */}
              <div
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  typeColors[activity.type] ?? "bg-gray-100 text-gray-700"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-medium ${
                          isCompleted
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {activity.subject}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {typeLabels[activity.type] ?? activity.type}
                      </Badge>
                      {activity.recurrenceRule && (
                        <span
                          className="inline-flex items-center gap-0.5 text-xs text-muted-foreground"
                          title={`Repeats ${activity.recurrenceRule}`}
                        >
                          <Repeat className="h-3 w-3" />
                          {activity.recurrenceRule}
                        </span>
                      )}
                      {isTask && isCompleted && (
                        <Badge
                          variant="default"
                          className="bg-green-600 text-xs"
                        >
                          Done
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {getUserName(activity)} &middot;{" "}
                      {formatTimestamp(activity.createdAt)}
                      {activity.dueDate && (
                        <>
                          {" "}
                          &middot; Due{" "}
                          {new Date(activity.dueDate).toLocaleDateString()}
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isTask && !isCompleted && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Mark complete"
                        disabled={completeTask.isPending}
                        onClick={() => completeTask.mutate(activity.id)}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      title="Delete"
                      disabled={deleteActivity.isPending}
                      onClick={() => deleteActivity.mutate(activity.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {activity.body && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {activity.body}
                  </p>
                )}

                {isTask && (
                  <SubtaskToggle
                    activity={activity}
                    contactId={contactId}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

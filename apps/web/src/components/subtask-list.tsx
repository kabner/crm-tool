"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useSubtasks,
  useCreateActivity,
  useCompleteTask,
} from "@/hooks/use-activities";
import type { Activity } from "@/hooks/use-activities";
import { cn } from "@/lib/utils";

interface SubtaskListProps {
  parentTaskId: string;
  dealId?: string;
  contactId?: string;
  companyId?: string;
}

export function SubtaskList({
  parentTaskId,
  dealId,
  contactId,
  companyId,
}: SubtaskListProps) {
  const { data: subtasks = [], isLoading } = useSubtasks(parentTaskId);
  const createActivity = useCreateActivity();
  const completeTask = useCompleteTask();
  const [showInput, setShowInput] = useState(false);
  const [newSubject, setNewSubject] = useState("");

  const outstanding = subtasks.filter((s: Activity) => !s.completedAt);
  const completed = subtasks.filter((s: Activity) => !!s.completedAt);

  const handleCreate = async () => {
    if (!newSubject.trim()) return;
    await createActivity.mutateAsync({
      type: "task",
      subject: newSubject.trim(),
      parentId: parentTaskId,
      dealId: dealId ?? undefined,
      contactId: contactId ?? undefined,
      companyId: companyId ?? undefined,
    });
    setNewSubject("");
    setShowInput(false);
  };

  if (isLoading) {
    return (
      <div className="ml-11 text-xs text-muted-foreground">
        Loading subtasks...
      </div>
    );
  }

  return (
    <div className="ml-11 mt-1 space-y-1">
      {/* Outstanding subtasks */}
      {outstanding.map((subtask: Activity) => (
        <div key={subtask.id} className="flex items-center gap-2 group">
          <button
            type="button"
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-muted-foreground/40 hover:border-primary hover:bg-primary/10 transition-colors"
            onClick={() => completeTask.mutate(subtask.id)}
            disabled={completeTask.isPending}
          >
            <Check className="h-2.5 w-2.5 opacity-0 group-hover:opacity-40" />
          </button>
          <span className="text-xs">{subtask.subject}</span>
        </div>
      ))}

      {/* Completed subtasks */}
      {completed.map((subtask: Activity) => (
        <div key={subtask.id} className="flex items-center gap-2">
          <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-green-500 bg-green-500/20">
            <Check className="h-2.5 w-2.5 text-green-600" />
          </div>
          <span className="text-xs line-through text-muted-foreground">
            {subtask.subject}
          </span>
        </div>
      ))}

      {/* Add subtask */}
      {showInput ? (
        <div className="flex items-center gap-1">
          <Input
            autoFocus
            placeholder="Subtask name..."
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") {
                setShowInput(false);
                setNewSubject("");
              }
            }}
            className="h-6 text-xs"
            disabled={createActivity.isPending}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={handleCreate}
            disabled={!newSubject.trim() || createActivity.isPending}
          >
            <Check className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          className={cn(
            "flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors",
          )}
          onClick={() => setShowInput(true)}
        >
          <Plus className="h-3 w-3" />
          Add subtask
        </button>
      )}
    </div>
  );
}

interface SubtaskToggleProps {
  activity: Activity;
  dealId?: string;
  contactId?: string;
  companyId?: string;
}

export function SubtaskToggle({
  activity,
  dealId,
  contactId,
  companyId,
}: SubtaskToggleProps) {
  const [expanded, setExpanded] = useState(false);
  const { data: subtasks = [] } = useSubtasks(activity.id);

  if (activity.type !== "task") return null;

  const completedCount = subtasks.filter((s: Activity) => !!s.completedAt).length;
  const totalCount = subtasks.length;

  return (
    <div>
      <button
        type="button"
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        Subtasks{totalCount > 0 ? ` (${completedCount}/${totalCount})` : ""}{" "}
        {expanded ? "\u25B4" : "\u25BE"}
      </button>
      {expanded && (
        <SubtaskList
          parentTaskId={activity.id}
          dealId={dealId ?? activity.dealId ?? undefined}
          contactId={contactId ?? activity.contactId ?? undefined}
          companyId={companyId ?? activity.companyId ?? undefined}
        />
      )}
    </div>
  );
}

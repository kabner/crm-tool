"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CalendarDays, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { usePipelineBoard, useMoveDealStage } from "@/hooks/use-deals";
import {
  useActivities,
  useCreateActivity,
  useUpdateActivity,
} from "@/hooks/use-activities";
import { useUserSettings } from "@/hooks/use-user-settings";
import { useRouter } from "next/navigation";

interface PipelineBoardProps {
  pipelineId: string;
  onDealClick?: (dealId: string) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function stageColor(stageType: string) {
  if (stageType === "won") return "bg-emerald-500";
  if (stageType === "lost") return "bg-red-500";
  return "bg-primary";
}

function stageTextColor(stageType: string) {
  if (stageType === "won") return "text-emerald-700 dark:text-emerald-400";
  if (stageType === "lost") return "text-red-700 dark:text-red-400";
  return "text-foreground";
}

function daysAgo(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function staleness(lastStageChangeAt: string | null, lastActivityAt: string | null): "fresh" | "aging" | "stale" {
  const stageDays = daysAgo(lastStageChangeAt);
  const activityDays = daysAgo(lastActivityAt);
  const mostRecentDays = Math.min(stageDays ?? Infinity, activityDays ?? Infinity);
  if (mostRecentDays === Infinity) return "fresh";
  if (mostRecentDays > 14) return "stale";
  if (mostRecentDays > 7) return "aging";
  return "fresh";
}

const DEFAULT_CARD_FIELDS = ["name", "amount", "company", "owner"];

interface PipelineCardSettings {
  cardFields?: string[];
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type ExpandedSection = "calendar" | "tasks";

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-blue-400",
};

interface DealInfo {
  id: string;
  name: string;
  amount: number | null;
  closeDate: string | null;
  owner: { firstName: string; lastName: string } | null;
  company: { name: string } | null;
  lastStageChangeAt: string | null;
  lastActivityAt: string | null;
  priority: string;
}

function DealCardExpansion({
  dealId,
  section,
}: {
  dealId: string;
  section: ExpandedSection;
}) {
  const { data: activitiesData } = useActivities({
    dealId,
    type: section === "tasks" ? "task" : undefined,
    limit: 50,
  });
  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity();
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");

  const activities = activitiesData?.data ?? [];

  if (section === "calendar") {
    const upcoming = activities
      .filter(
        (a) => a.dueDate && !a.completedAt && new Date(a.dueDate) >= new Date(),
      )
      .sort(
        (a, b) =>
          new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime(),
      );

    const next = upcoming[0];

    return (
      <div className="mt-2 border-t pt-2 text-xs text-muted-foreground space-y-1">
        {next ? (
          <div>
            <p className="font-medium text-foreground">
              {next.type === "task" ? "Task" : next.type === "meeting" ? "Meeting" : next.type === "call" ? "Call" : "Activity"}: {next.subject}
            </p>
            <p>
              {next.dueDate ? formatShortDate(next.dueDate) : "No date"}
            </p>
          </div>
        ) : (
          <p>No upcoming actions</p>
        )}
      </div>
    );
  }

  // Tasks section
  const tasks = activities.filter((a) => a.type === "task");
  const outstandingTasks = tasks.filter((t) => !t.completedAt);
  const completedTasks = tasks.filter((t) => t.completedAt);

  const handleCreateTask = () => {
    if (!newTaskName.trim()) return;
    createActivity.mutate({
      type: "task",
      subject: newTaskName.trim(),
      dealId,
    });
    setNewTaskName("");
    setAddingTask(false);
  };

  const handleCompleteTask = (taskId: string) => {
    updateActivity.mutate({
      id: taskId,
      data: { completedAt: new Date().toISOString() },
    });
  };

  return (
    <div className="mt-2 border-t pt-2 space-y-1 text-xs">
      {outstandingTasks.map((task) => (
        <label key={task.id} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="rounded"
            onChange={() => handleCompleteTask(task.id)}
            onClick={(e) => e.stopPropagation()}
          />
          <span>{task.subject}</span>
        </label>
      ))}
      {!addingTask ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setAddingTask(true);
          }}
          className="text-primary hover:underline"
        >
          + Add Task
        </button>
      ) : (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <input
            className="flex-1 rounded border px-2 py-1 text-xs"
            placeholder="Task name..."
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateTask()}
            autoFocus
          />
          <button onClick={handleCreateTask} className="text-primary text-xs font-medium">
            Add
          </button>
        </div>
      )}
      {completedTasks.length > 0 && (
        <div className="mt-1 opacity-60">
          {completedTasks.map((task) => (
            <label key={task.id} className="flex items-center gap-2 line-through">
              <input type="checkbox" checked disabled className="rounded" />
              <span>{task.subject}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function DealCardFooter({
  deal,
  expandedSection,
  onToggleExpand,
}: {
  deal: DealInfo;
  expandedSection: ExpandedSection | null;
  onToggleExpand: (section: ExpandedSection) => void;
}) {
  // Fetch tasks count for the badge
  const { data: tasksData } = useActivities({
    dealId: deal.id,
    type: "task",
    limit: 100,
  });

  // Fetch upcoming activities for calendar badge
  const { data: allActivitiesData } = useActivities({
    dealId: deal.id,
    limit: 100,
  });

  const tasks = tasksData?.data ?? [];
  const outstandingTaskCount = tasks.filter((t) => !t.completedAt).length;

  const allActivities = allActivitiesData?.data ?? [];
  const nextAction = allActivities
    .filter(
      (a) => a.dueDate && !a.completedAt && new Date(a.dueDate) >= new Date(),
    )
    .sort(
      (a, b) =>
        new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime(),
    )[0];

  return (
    <>
      <div className="flex items-center justify-between border-t pt-2 mt-2 text-xs text-muted-foreground">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand("calendar");
          }}
          className={cn(
            "flex items-center gap-1 hover:text-foreground transition-colors",
            expandedSection === "calendar" && "text-primary",
          )}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          {nextAction?.dueDate && (
            <span>{formatShortDate(nextAction.dueDate)}</span>
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand("tasks");
          }}
          className={cn(
            "flex items-center gap-1 hover:text-foreground transition-colors",
            expandedSection === "tasks" && "text-primary",
          )}
        >
          <CheckSquare className="h-3.5 w-3.5" />
          {outstandingTaskCount > 0 && <span>{outstandingTaskCount}</span>}
        </button>
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary"
          title={
            deal.owner
              ? `${deal.owner.firstName} ${deal.owner.lastName}`
              : "Unassigned"
          }
        >
          {deal.owner
            ? `${deal.owner.firstName[0]}${deal.owner.lastName[0]}`
            : "??"}
        </div>
      </div>
      {expandedSection && (
        <div
          className="animate-in slide-in-from-top-1 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <DealCardExpansion dealId={deal.id} section={expandedSection} />
        </div>
      )}
    </>
  );
}

export function PipelineBoard({ pipelineId, onDealClick }: PipelineBoardProps) {
  const { data, isLoading } = usePipelineBoard(pipelineId);
  const moveDealStage = useMoveDealStage();
  const router = useRouter();
  const { data: cardSettings } = useUserSettings<PipelineCardSettings>("pipelines");
  const cardFields = cardSettings?.cardFields ?? DEFAULT_CARD_FIELDS;

  const [draggingDealId, setDraggingDealId] = useState<string | null>(null);
  const [hoveredStageId, setHoveredStageId] = useState<string | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<number>(0);

  // Inline expansion state
  const [expandedDealId, setExpandedDealId] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<ExpandedSection | null>(null);

  const toggleExpand = useCallback((dealId: string, section: ExpandedSection) => {
    if (expandedDealId === dealId && expandedSection === section) {
      setExpandedDealId(null);
      setExpandedSection(null);
    } else {
      setExpandedDealId(dealId);
      setExpandedSection(section);
    }
  }, [expandedDealId, expandedSection]);

  // Refs to avoid stale closures
  const draggingRef = useRef<string | null>(null);
  const hoveredStageRef = useRef<string | null>(null);
  const hoveredPosRef = useRef<number>(0);
  const didDragRef = useRef(false);
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
  const pendingDealId = useRef<string | null>(null);
  const DRAG_THRESHOLD = 5; // pixels before considering it a drag

  // Map stage column DOM elements by stageId for hit testing
  const stageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  // Map card DOM elements for position detection
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const setStageRef = useCallback((stageId: string, el: HTMLDivElement | null) => {
    if (el) stageRefs.current.set(stageId, el);
    else stageRefs.current.delete(stageId);
  }, []);

  const setCardRef = useCallback((dealId: string, el: HTMLDivElement | null) => {
    if (el) cardRefs.current.set(dealId, el);
    else cardRefs.current.delete(dealId);
  }, []);

  // Global mousemove + mouseup — handles both drag-threshold detection and active drag tracking
  // Always active so we can detect when mousedown transitions to drag
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      // Phase 1: Check if we should START dragging (threshold detection)
      if (pendingDealId.current && !draggingRef.current && mouseDownPos.current) {
        const dx = e.clientX - mouseDownPos.current.x;
        const dy = e.clientY - mouseDownPos.current.y;
        if (Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD) {
          // Start the drag
          draggingRef.current = pendingDealId.current;
          didDragRef.current = true;
          setDraggingDealId(pendingDealId.current);
          pendingDealId.current = null;
          mouseDownPos.current = null;
        }
        return;
      }

      // Phase 2: Track drag position
      if (!draggingRef.current || !data) return;

      // Find which stage column the cursor is over
      let foundStage: string | null = null;
      let foundPos = 0;

      for (const stage of data.stages) {
        const el = stageRefs.current.get(stage.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
          foundStage = stage.id;

          // Find position within the column by checking card positions
          foundPos = stage.deals.length; // default: end
          for (let i = 0; i < stage.deals.length; i++) {
            const deal = stage.deals[i]!;
            const cardEl = cardRefs.current.get(deal.id);
            if (!cardEl) continue;
            const cardRect = cardEl.getBoundingClientRect();
            const midY = cardRect.top + cardRect.height / 2;
            if (e.clientY < midY) {
              foundPos = i;
              break;
            }
          }
          break;
        }
      }

      if (foundStage !== hoveredStageRef.current || foundPos !== hoveredPosRef.current) {
        hoveredStageRef.current = foundStage;
        hoveredPosRef.current = foundPos;
        setHoveredStageId(foundStage);
        setHoveredPosition(foundPos);
      }
    }

    function onMouseUp() {
      // If we never started dragging (mouse didn't move past threshold), just clean up
      if (pendingDealId.current) {
        pendingDealId.current = null;
        mouseDownPos.current = null;
        // didDragRef stays false so the click handler will navigate
        return;
      }

      const dealId = draggingRef.current;
      const stageId = hoveredStageRef.current;
      const position = hoveredPosRef.current;

      // Reset state
      draggingRef.current = null;
      hoveredStageRef.current = null;
      hoveredPosRef.current = 0;
      setDraggingDealId(null);
      setHoveredStageId(null);
      setHoveredPosition(0);

      if (dealId && stageId) {
        moveDealStage.mutate({ id: dealId, stageId, position });
      }

      setTimeout(() => { didDragRef.current = false; }, 200);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [draggingDealId, data, moveDealStage, DRAG_THRESHOLD]);

  function handleCardMouseDown(e: React.MouseEvent, dealId: string) {
    if (e.button !== 0) return;
    // Don't start drag yet — wait for mouse movement past threshold
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
    pendingDealId.current = dealId;
    didDragRef.current = false;
  }

  function handleCardClick(dealId: string) {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    if (onDealClick) {
      onDealClick(dealId);
    } else {
      router.push(`/deals/${dealId}`);
    }
  }

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex w-72 shrink-0 flex-col">
            <div className="rounded-t-lg bg-muted p-3">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="mt-1 h-3 w-20" />
            </div>
            <div className="flex-1 space-y-2 rounded-b-lg border border-t-0 border-border bg-muted/20 p-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.stages.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-md border border-border">
        <p className="text-sm text-muted-foreground">No stages configured for this pipeline.</p>
      </div>
    );
  }

  return (
    <div
      className={cn("flex gap-4 overflow-x-auto pb-4 select-none", draggingDealId && "cursor-grabbing")}
      style={{ minHeight: 400 }}
    >
      {data.stages.map((stage) => {
        const stageValue = stage.deals.reduce(
          (sum: number, d: DealInfo) => sum + (d.amount != null ? Number(d.amount) : 0),
          0,
        );
        const isOver = hoveredStageId === stage.id && draggingDealId !== null;

        return (
          <div key={stage.id} className="flex w-72 shrink-0 flex-col">
            {/* Stage header */}
            <div className="rounded-t-lg bg-muted/50 border border-border overflow-hidden">
              <div className={cn("h-1", stageColor(stage.stageType))} />
              <div className="px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <h3 className={cn("text-sm font-semibold", stageTextColor(stage.stageType))}>
                    {stage.name}
                  </h3>
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
                    {stage.deals.length}
                  </span>
                </div>
                {stageValue > 0 && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatCurrency(stageValue)}</p>
                )}
              </div>
            </div>

            {/* Stage body — this is the drop target */}
            <div
              ref={(el) => setStageRef(stage.id, el)}
              className={cn(
                "flex flex-1 flex-col gap-1 rounded-b-lg border border-t-0 border-border p-2 transition-colors",
                isOver ? "bg-primary/10 border-primary/40 ring-2 ring-primary/30" : "bg-muted/10",
              )}
              style={{ minHeight: 120 }}
            >
              {stage.deals.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                  <p className={cn("text-xs", isOver ? "text-primary font-medium" : "text-muted-foreground/50")}>
                    {isOver ? "Release to drop here" : "No deals"}
                  </p>
                </div>
              ) : (
                stage.deals.map((deal: DealInfo, idx: number) => {
                  const isDragging = draggingDealId === deal.id;
                  const showIndicatorBefore = isOver && hoveredPosition === idx && !isDragging;
                  const showIndicatorAfter =
                    isOver && hoveredPosition === stage.deals.length && idx === stage.deals.length - 1 && !isDragging;

                  return (
                    <div key={deal.id}>
                      {showIndicatorBefore && (
                        <div className="h-1 bg-primary rounded-full mx-1 mb-1 animate-pulse" />
                      )}
                      <div
                        ref={(el) => setCardRef(deal.id, el)}
                        onMouseDown={(e) => handleCardMouseDown(e, deal.id)}
                        onClick={() => handleCardClick(deal.id)}
                        className={cn(
                          "rounded-lg border bg-card p-3 shadow-sm transition-all",
                          isDragging ? "opacity-30 ring-2 ring-primary scale-95" : "hover:shadow-md hover:border-primary/30",
                          draggingDealId ? "cursor-grabbing" : "cursor-pointer",
                          !isDragging && staleness(deal.lastStageChangeAt, deal.lastActivityAt) === "stale" && "border-destructive/40",
                          !isDragging && staleness(deal.lastStageChangeAt, deal.lastActivityAt) === "aging" && "border-amber-500/40",
                        )}
                      >
                        {/* Priority dot + Name (always shown) */}
                        <div className="flex items-center gap-1.5">
                          {deal.priority && PRIORITY_DOT[deal.priority] && (
                            <span className={cn("h-2 w-2 rounded-full shrink-0", PRIORITY_DOT[deal.priority])} />
                          )}
                          <p className="text-sm font-semibold text-foreground truncate">{deal.name}</p>
                        </div>

                        {/* Dynamic card fields */}
                        {cardFields.includes("company") && deal.company && (
                          <p className="mt-1 text-xs text-muted-foreground truncate">{deal.company.name}</p>
                        )}
                        {cardFields.includes("amount") && deal.amount != null && (
                          <p className="mt-2 text-base font-bold text-foreground">
                            {formatCurrency(Number(deal.amount))}
                          </p>
                        )}
                        {cardFields.includes("owner") && deal.owner && (
                          <p className="mt-1 text-xs text-muted-foreground truncate">
                            {deal.owner.firstName} {deal.owner.lastName}
                          </p>
                        )}
                        {cardFields.includes("closeDate") && deal.closeDate && (
                          <p className={cn(
                            "mt-1 text-xs",
                            new Date(deal.closeDate) < new Date()
                              ? "font-medium text-destructive"
                              : "text-muted-foreground",
                          )}>
                            Close: {formatShortDate(deal.closeDate)}
                          </p>
                        )}
                        {cardFields.includes("priority") && deal.priority && (
                          <p className="mt-1 text-xs text-muted-foreground">Priority: {deal.priority}</p>
                        )}

                        {/* Staleness indicator */}
                        <div className="mt-1 flex items-center gap-2">
                          {(() => {
                            const s = staleness(deal.lastStageChangeAt, deal.lastActivityAt);
                            if (s === "stale") return <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" title="Stale — no activity in 14+ days" />;
                            if (s === "aging") return <span className="h-2 w-2 rounded-full bg-amber-500" title="Aging — no activity in 7+ days" />;
                            return null;
                          })()}
                        </div>

                        {/* Card footer with icons */}
                        <DealCardFooter
                          deal={deal}
                          expandedSection={expandedDealId === deal.id ? expandedSection : null}
                          onToggleExpand={(section) => toggleExpand(deal.id, section)}
                        />
                      </div>
                      {showIndicatorAfter && (
                        <div className="h-1 bg-primary rounded-full mx-1 mt-1 animate-pulse" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

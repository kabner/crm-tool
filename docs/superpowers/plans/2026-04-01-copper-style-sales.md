# Copper-Style Sales Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the existing deals/pipeline experience to match Copper CRM's relationship-focused, low-friction sales UX — adding stage aging with stale deal indicators, a slide-out quick-view panel, a wired-up activity timeline, a loss-reason dialog, and deal priority.

**Architecture:** Six focused changes layered on top of the existing deals infrastructure. A single database migration adds three columns to the `deals` table (`last_stage_change_at`, `last_activity_at`, `priority`). Backend changes are additive (new fields in existing entity/DTOs/service). Frontend adds a reusable Sheet component, a DealQuickView panel, stale-deal visual cues on the Kanban board, and a loss-reason dialog. No new database tables. No changes to auth, tenancy, or other modules.

**Tech Stack:** TypeORM migration (PostgreSQL), NestJS entity/DTO/service updates, React (Next.js App Router), TanStack Query, Radix UI Dialog, Tailwind CSS.

---

## File Map

### New Files
| File | Purpose |
|---|---|
| `apps/api/src/database/migrations/1711930000000-AddDealSalesFields.ts` | Migration: add `last_stage_change_at`, `last_activity_at`, `priority` to deals |
| `apps/web/src/components/ui/sheet.tsx` | Reusable slide-out drawer/sheet component (Radix Dialog based) |
| `apps/web/src/app/(dashboard)/deals/components/deal-quick-view.tsx` | Slide-out panel showing deal details, stage selector, activity timeline |
| `apps/web/src/app/(dashboard)/deals/components/loss-reason-dialog.tsx` | Modal dialog prompting for loss reason when deal moves to "lost" stage |
| `apps/web/src/app/(dashboard)/deals/components/deal-activity-timeline.tsx` | Activity timeline component for deal detail and quick-view |
| `apps/web/src/hooks/use-activities.ts` | React Query hooks for fetching deal activities |

### Modified Files
| File | Changes |
|---|---|
| `apps/api/src/modules/crm/entities/deal.entity.ts` | Add `lastStageChangeAt`, `lastActivityAt`, `priority` columns |
| `apps/api/src/modules/crm/dto/create-deal.dto.ts` | Add optional `priority` field |
| `apps/api/src/modules/crm/dto/update-deal.dto.ts` | Inherits `priority` from CreateDealDto |
| `apps/api/src/modules/crm/services/deals.service.ts` | Set `lastStageChangeAt` on create/stage-move, include new fields in board response |
| `apps/web/src/hooks/use-deals.ts` | Add `lastStageChangeAt`, `lastActivityAt`, `priority` to Deal type and PipelineStage deal type |
| `apps/web/src/app/(dashboard)/deals/components/pipeline-board.tsx` | Add stale indicators, priority badges, click opens quick-view instead of navigate |
| `apps/web/src/app/(dashboard)/deals/[id]/page.tsx` | Replace activity placeholder with DealActivityTimeline |
| `apps/web/src/app/(dashboard)/deals/page.tsx` | Add DealQuickView and LossReasonDialog integration |

---

## Task 1: Database Migration — Add Sales Fields to Deals

**Files:**
- Create: `apps/api/src/database/migrations/1711930000000-AddDealSalesFields.ts`

- [ ] **Step 1: Create the migration file**

```typescript
// apps/api/src/database/migrations/1711930000000-AddDealSalesFields.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDealSalesFields1711930000000 implements MigrationInterface {
  name = 'AddDealSalesFields1711930000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE deals
      ADD COLUMN IF NOT EXISTS last_stage_change_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'none'
    `);

    -- Backfill last_stage_change_at from updated_at for existing deals
    await queryRunner.query(`
      UPDATE deals SET last_stage_change_at = updated_at WHERE last_stage_change_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE deals
      DROP COLUMN IF EXISTS last_stage_change_at,
      DROP COLUMN IF EXISTS last_activity_at,
      DROP COLUMN IF EXISTS priority
    `);
  }
}
```

- [ ] **Step 2: Run the migration**

Run: `cd /Users/keenanabner/crm-tool && pnpm db:migrate`
Expected: Migration runs successfully, no errors.

- [ ] **Step 3: Verify columns exist**

Run: `cd /Users/keenanabner/crm-tool && docker exec -i $(docker ps -q -f name=postgres) psql -U postgres -d crm -c "\d deals" | grep -E "last_stage|last_activity|priority"`
Expected: Three new columns visible.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/database/migrations/1711930000000-AddDealSalesFields.ts
git commit -m "feat(sales): add migration for stage aging, activity tracking, and priority fields"
```

---

## Task 2: Update Deal Entity and DTOs

**Files:**
- Modify: `apps/api/src/modules/crm/entities/deal.entity.ts`
- Modify: `apps/api/src/modules/crm/dto/create-deal.dto.ts`

- [ ] **Step 1: Add new columns to the Deal entity**

In `apps/api/src/modules/crm/entities/deal.entity.ts`, add these three columns after the `position` column (line 52) and before the `customProps` column:

```typescript
  @Column({ name: 'last_stage_change_at', type: 'timestamptz', nullable: true })
  lastStageChangeAt: Date;

  @Column({ name: 'last_activity_at', type: 'timestamptz', nullable: true })
  lastActivityAt: Date;

  @Column({ default: 'none' })
  priority: string;
```

- [ ] **Step 2: Add priority to CreateDealDto**

In `apps/api/src/modules/crm/dto/create-deal.dto.ts`, add at the end of the class:

```typescript
  @IsOptional()
  @IsString()
  @IsIn(['none', 'low', 'medium', 'high'])
  priority?: string;
```

Also add `IsIn` to the `class-validator` import at the top of the file.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/keenanabner/crm-tool && pnpm --filter api build`
Expected: Build succeeds with no type errors.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/crm/entities/deal.entity.ts apps/api/src/modules/crm/dto/create-deal.dto.ts
git commit -m "feat(sales): add lastStageChangeAt, lastActivityAt, priority to Deal entity and DTO"
```

---

## Task 3: Update DealsService — Stage Aging and Board Response

**Files:**
- Modify: `apps/api/src/modules/crm/services/deals.service.ts`

- [ ] **Step 1: Set lastStageChangeAt on deal creation**

In `deals.service.ts`, in the `create` method, update the `this.dealRepository.create(...)` call (around line 27) to include `lastStageChangeAt`:

```typescript
    const deal = this.dealRepository.create({
      ...dealData,
      tenantId,
      ownerId: dealData.ownerId ?? userId,
      lastStageChangeAt: new Date(),
    });
```

- [ ] **Step 2: Set lastStageChangeAt on stage move**

In the `moveStage` method, add `lastStageChangeAt` to the `updateFields` object (around line 192):

```typescript
    const updateFields: Record<string, unknown> = {
      stageId,
      won: wonValue,
      lastStageChangeAt: new Date(),
    };
```

- [ ] **Step 3: Include new fields in the board response**

In the `getByPipeline` method, the deals query already fetches all columns. The new fields will be included automatically since they're entity columns. No code change needed here — but verify the `relations` array in the `findOne` call (line 128) doesn't filter them out. It doesn't — TypeORM loads all entity columns by default.

- [ ] **Step 4: Set lastStageChangeAt when stageId changes via update**

In the `update` method, after the stage type check block (around line 159), add:

```typescript
    if (updateData.stageId && updateData.stageId !== deal.stageId) {
      // ... existing stage type check code ...
      (updateData as any).lastStageChangeAt = new Date();
    }
```

Actually, more precisely — find the existing block that starts `if (updateData.stageId && updateData.stageId !== deal.stageId)` and add the line inside it, after the `if (newStage)` block closes:

```typescript
      (updateData as any).lastStageChangeAt = new Date();
```

- [ ] **Step 5: Verify build**

Run: `cd /Users/keenanabner/crm-tool && pnpm --filter api build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/crm/services/deals.service.ts
git commit -m "feat(sales): track stage change timestamps on create, move, and update"
```

---

## Task 4: Frontend — Activities Hook and Timeline Component

**Files:**
- Create: `apps/web/src/hooks/use-activities.ts`
- Create: `apps/web/src/app/(dashboard)/deals/components/deal-activity-timeline.tsx`

- [ ] **Step 1: Create the activities hook**

```typescript
// apps/web/src/hooks/use-activities.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface Activity {
  id: string;
  type: string;
  subject: string;
  body: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string } | null;
}

export interface ActivitiesResponse {
  data: Activity[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function useDealActivities(dealId: string, page = 1) {
  return useQuery<ActivitiesResponse>({
    queryKey: ["activities", "deal", dealId, page],
    queryFn: () =>
      apiClient.get<ActivitiesResponse>(
        `/api/v1/activities?dealId=${dealId}&page=${page}&limit=20&sort=createdAt&order=DESC`,
      ),
    enabled: !!dealId,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      type: string;
      subject: string;
      body?: string;
      dealId?: string;
      contactId?: string;
      companyId?: string;
      dueDate?: string;
    }) => apiClient.post("/api/v1/activities", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useCompleteActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.patch(`/api/v1/activities/${id}/complete`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}
```

- [ ] **Step 2: Create the DealActivityTimeline component**

```tsx
// apps/web/src/app/(dashboard)/deals/components/deal-activity-timeline.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";

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

  const handleCreate = async () => {
    if (!newSubject.trim()) return;
    await createActivity.mutateAsync({
      type: newType,
      subject: newSubject,
      dealId,
    });
    setNewSubject("");
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
      {/* Quick add */}
      {!showForm ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShowForm(true)}
        >
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
              placeholder="What happened?"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="h-8 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setShowForm(false); setNewSubject(""); }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!newSubject.trim() || createActivity.isPending}
            >
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No activities yet
        </p>
      ) : (
        <div className="space-y-1">
          {activities.slice(0, compact ? 5 : undefined).map((activity) => {
            const Icon = ACTIVITY_ICONS[activity.type] ?? Clock;
            const colorClass = ACTIVITY_COLORS[activity.type] ?? "bg-muted text-muted-foreground";
            const isTask = activity.type === "task";
            const isCompleted = !!activity.completedAt;

            return (
              <div
                key={activity.id}
                className="flex gap-3 rounded-md px-2 py-2 hover:bg-muted/50 transition-colors"
              >
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", colorClass)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm", isTask && isCompleted && "line-through text-muted-foreground")}>
                    {activity.subject}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.user
                      ? `${activity.user.firstName} ${activity.user.lastName}`
                      : "System"}{" "}
                    · {new Date(activity.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {isTask && !isCompleted && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => completeActivity.mutate(activity.id)}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                )}
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
```

- [ ] **Step 3: Verify frontend build**

Run: `cd /Users/keenanabner/crm-tool && pnpm --filter web build`
Expected: Build succeeds (components not imported anywhere yet, but files should be valid).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/hooks/use-activities.ts apps/web/src/app/\(dashboard\)/deals/components/deal-activity-timeline.tsx
git commit -m "feat(sales): add activities hook and deal activity timeline component"
```

---

## Task 5: Frontend — Sheet (Slide-Out Drawer) UI Component

**Files:**
- Create: `apps/web/src/components/ui/sheet.tsx`

- [ ] **Step 1: Create the Sheet component**

This is a reusable slide-out panel built on top of Radix Dialog, following the same pattern as the existing Radix-based UI components in `components/ui/`.

```tsx
// apps/web/src/components/ui/sheet.tsx
"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
SheetOverlay.displayName = "SheetOverlay";

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: "left" | "right";
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 flex flex-col bg-background shadow-lg transition-transform duration-300 ease-in-out",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        side === "right" &&
          "inset-y-0 right-0 h-full w-full max-w-lg border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
        side === "left" &&
          "inset-y-0 left-0 h-full w-full max-w-lg border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = "SheetContent";

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-2 border-b px-6 py-4", className)} {...props} />
);
SheetHeader.displayName = "SheetHeader";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
));
SheetTitle.displayName = "SheetTitle";

const SheetBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex-1 overflow-y-auto px-6 py-4", className)} {...props} />
);
SheetBody.displayName = "SheetBody";

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
};
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/keenanabner/crm-tool && pnpm --filter web build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/ui/sheet.tsx
git commit -m "feat(ui): add reusable Sheet slide-out drawer component"
```

---

## Task 6: Frontend — Deal Quick-View Panel

**Files:**
- Create: `apps/web/src/app/(dashboard)/deals/components/deal-quick-view.tsx`

- [ ] **Step 1: Create the DealQuickView component**

```tsx
// apps/web/src/app/(dashboard)/deals/components/deal-quick-view.tsx
"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useDeal, useMoveDealStage, usePipeline } from "@/hooks/use-deals";
import { DealActivityTimeline } from "./deal-activity-timeline";
import { ExternalLink, Clock, Building2, User, CalendarDays, TrendingUp } from "lucide-react";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function daysInStage(lastStageChangeAt: string | null): number | null {
  if (!lastStageChangeAt) return null;
  const diff = Date.now() - new Date(lastStageChangeAt).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

const PRIORITY_BADGE: Record<string, { label: string; className: string }> = {
  high: { label: "High", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  medium: { label: "Medium", className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  low: { label: "Low", className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
};

interface DealQuickViewProps {
  dealId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestLossReason?: (dealId: string, stageId: string) => void;
}

export function DealQuickView({ dealId, open, onOpenChange, onRequestLossReason }: DealQuickViewProps) {
  const router = useRouter();
  const { data: deal, isLoading } = useDeal(dealId ?? "");
  const moveDealStage = useMoveDealStage();

  const pipelineId = deal?.pipeline?.id ?? deal?.stage?.pipeline?.id ?? "";
  const { data: pipeline } = usePipeline(pipelineId);

  const stages = pipeline?.stages
    ? [...pipeline.stages].sort((a, b) => a.position - b.position)
    : [];

  const handleStageChange = (stageId: string) => {
    if (!dealId) return;
    const targetStage = stages.find((s) => s.id === stageId);
    if (targetStage?.stageType === "lost" && onRequestLossReason) {
      onRequestLossReason(dealId, stageId);
      return;
    }
    moveDealStage.mutate({ id: dealId, stageId });
  };

  const days = deal?.lastStageChangeAt ? daysInStage(deal.lastStageChangeAt as unknown as string) : null;
  const priorityInfo = deal?.priority ? PRIORITY_BADGE[deal.priority] : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="max-w-md">
        {isLoading || !deal ? (
          <SheetHeader>
            <Skeleton className="h-6 w-48" />
          </SheetHeader>
        ) : (
          <>
            <SheetHeader>
              <div className="flex items-start justify-between pr-8">
                <div>
                  <SheetTitle>{deal.name}</SheetTitle>
                  {deal.amount != null && (
                    <p className="text-lg font-bold text-foreground mt-0.5">
                      {formatCurrency(deal.amount)}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    onOpenChange(false);
                    router.push(`/deals/${deal.id}`);
                  }}
                  title="Open full detail"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              {/* Stage badges and priority */}
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge
                  variant={
                    deal.stage?.stageType === "won"
                      ? "default"
                      : deal.stage?.stageType === "lost"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {deal.stage?.name}
                </Badge>
                {priorityInfo && (
                  <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", priorityInfo.className)}>
                    {priorityInfo.label} Priority
                  </span>
                )}
                {days != null && (
                  <span className={cn(
                    "inline-flex items-center gap-1 text-xs",
                    days > 14 ? "text-destructive font-medium" : "text-muted-foreground",
                  )}>
                    <Clock className="h-3 w-3" />
                    {days}d in stage
                  </span>
                )}
              </div>
            </SheetHeader>

            <SheetBody>
              {/* Stage selector */}
              {stages.length > 0 && deal.stage?.stageType === "open" && (
                <div className="mb-6">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Move to stage</p>
                  <div className="flex gap-1 flex-wrap">
                    {stages.map((stage) => {
                      const isCurrent = stage.id === deal.stage?.id;
                      return (
                        <button
                          key={stage.id}
                          onClick={() => handleStageChange(stage.id)}
                          disabled={isCurrent || moveDealStage.isPending}
                          className={cn(
                            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors border",
                            isCurrent
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground",
                            isCurrent && "cursor-default",
                          )}
                        >
                          {stage.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Deal details */}
              <div className="space-y-3 mb-6">
                <p className="text-xs font-medium text-muted-foreground">Details</p>
                <div className="grid grid-cols-2 gap-3">
                  {deal.company && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{deal.company.name}</span>
                    </div>
                  )}
                  {deal.owner && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{deal.owner.firstName} {deal.owner.lastName}</span>
                    </div>
                  )}
                  {deal.closeDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className={cn(
                        new Date(deal.closeDate) < new Date() && deal.stage?.stageType === "open"
                          ? "text-destructive font-medium"
                          : "",
                      )}>
                        {new Date(deal.closeDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  )}
                  {deal.stage?.probability != null && (
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{deal.stage.probability}% probability</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity timeline */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Activity</p>
                <DealActivityTimeline dealId={deal.id} compact />
              </div>
            </SheetBody>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/keenanabner/crm-tool && pnpm --filter web build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/deals/components/deal-quick-view.tsx
git commit -m "feat(sales): add deal quick-view slide-out panel with stage selector and activity timeline"
```

---

## Task 7: Frontend — Loss Reason Dialog

**Files:**
- Create: `apps/web/src/app/(dashboard)/deals/components/loss-reason-dialog.tsx`

- [ ] **Step 1: Create the LossReasonDialog component**

```tsx
// apps/web/src/app/(dashboard)/deals/components/loss-reason-dialog.tsx
"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const COMMON_REASONS = [
  "Price too high",
  "Chose competitor",
  "No budget",
  "Bad timing",
  "No decision made",
  "Product missing features",
  "Lost contact",
];

interface LossReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  dealName?: string;
}

export function LossReasonDialog({
  open,
  onOpenChange,
  onConfirm,
  dealName,
}: LossReasonDialogProps) {
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const handleConfirm = () => {
    const finalReason = reason === "__custom" ? customReason : reason;
    onConfirm(finalReason || "No reason provided");
    setReason("");
    setCustomReason("");
  };

  const handleCancel = () => {
    setReason("");
    setCustomReason("");
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          <Dialog.Title className="text-lg font-semibold">
            Mark Deal as Lost
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            {dealName
              ? `Why was "${dealName}" lost?`
              : "Why was this deal lost?"}
          </Dialog.Description>

          <div className="mt-4 space-y-3">
            {/* Common reasons */}
            <div className="flex flex-wrap gap-2">
              {COMMON_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => { setReason(r); setCustomReason(""); }}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    reason === r
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
              <button
                onClick={() => setReason("__custom")}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  reason === "__custom"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
              >
                Other...
              </button>
            </div>

            {/* Custom reason input */}
            {reason === "__custom" && (
              <input
                type="text"
                placeholder="Enter reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && customReason && handleConfirm()}
              />
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={!reason || (reason === "__custom" && !customReason.trim())}
            >
              Mark as Lost
            </Button>
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
              onClick={handleCancel}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/keenanabner/crm-tool && pnpm --filter web build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/deals/components/loss-reason-dialog.tsx
git commit -m "feat(sales): add loss reason dialog with common reasons and custom input"
```

---

## Task 8: Update Frontend Deal Types

**Files:**
- Modify: `apps/web/src/hooks/use-deals.ts`

- [ ] **Step 1: Add new fields to Deal type**

In `apps/web/src/hooks/use-deals.ts`, add three fields to the `Deal` interface (after `updatedAt` on line 32):

```typescript
  won: boolean | null;
  lastStageChangeAt: string | null;
  lastActivityAt: string | null;
  priority: string;
```

- [ ] **Step 2: Add new fields to PipelineStage deal type**

In the same file, update the `deals` array type inside `PipelineStage` (around line 70) to include the new fields. Replace the existing `deals` type:

```typescript
  deals: {
    id: string;
    name: string;
    amount: number | null;
    closeDate: string | null;
    owner: DealOwner | null;
    company: DealCompany | null;
    lastStageChangeAt: string | null;
    lastActivityAt: string | null;
    priority: string;
  }[];
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/keenanabner/crm-tool && pnpm --filter web build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/hooks/use-deals.ts
git commit -m "feat(sales): add stage aging, activity tracking, and priority to frontend Deal types"
```

---

## Task 9: Update Pipeline Board — Stale Indicators, Priority, Quick View

**Files:**
- Modify: `apps/web/src/app/(dashboard)/deals/components/pipeline-board.tsx`

- [ ] **Step 1: Update the DealInfo interface and add helpers**

In `pipeline-board.tsx`, replace the existing `DealInfo` interface (around line 34) with:

```typescript
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
```

Add these helper functions after `stageTextColor` (around line 32):

```typescript
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

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-blue-400",
};
```

- [ ] **Step 2: Update PipelineBoardProps to accept onDealClick callback**

Replace the `PipelineBoardProps` interface and update the component signature:

```typescript
interface PipelineBoardProps {
  pipelineId: string;
  onDealClick?: (dealId: string) => void;
}

export function PipelineBoard({ pipelineId, onDealClick }: PipelineBoardProps) {
```

- [ ] **Step 3: Update handleCardClick to use callback**

Replace the `handleCardClick` function:

```typescript
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
```

- [ ] **Step 4: Update deal card rendering with stale indicators and priority dots**

Inside the deal card `<div>` (the one with `rounded-lg border border-border bg-card p-3`), replace the card contents with:

```tsx
                        {/* Priority dot + Name */}
                        <div className="flex items-center gap-1.5">
                          {deal.priority && PRIORITY_DOT[deal.priority] && (
                            <span className={cn("h-2 w-2 rounded-full shrink-0", PRIORITY_DOT[deal.priority])} />
                          )}
                          <p className="text-sm font-semibold text-foreground truncate">{deal.name}</p>
                        </div>
                        {deal.company && (
                          <p className="mt-1 text-xs text-muted-foreground truncate">{deal.company.name}</p>
                        )}
                        {deal.amount != null && (
                          <p className="mt-2 text-base font-bold text-foreground">
                            {formatCurrency(Number(deal.amount))}
                          </p>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {deal.closeDate ? (
                              <span
                                className={cn(
                                  "text-xs",
                                  new Date(deal.closeDate) < new Date()
                                    ? "font-medium text-destructive"
                                    : "text-muted-foreground",
                                )}
                              >
                                {new Date(deal.closeDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            ) : null}
                            {/* Stale indicator */}
                            {(() => {
                              const s = staleness(deal.lastStageChangeAt, deal.lastActivityAt);
                              if (s === "stale") return <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" title="Stale — no activity in 14+ days" />;
                              if (s === "aging") return <span className="h-2 w-2 rounded-full bg-amber-500" title="Aging — no activity in 7+ days" />;
                              return null;
                            })()}
                          </div>
                          {deal.owner && (
                            <div
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary"
                              title={`${deal.owner.firstName} ${deal.owner.lastName}`}
                            >
                              {deal.owner.firstName.charAt(0)}
                              {deal.owner.lastName.charAt(0)}
                            </div>
                          )}
                        </div>
```

- [ ] **Step 5: Add stale border styling to the card container**

Update the card container's `className` to include stale border colors. Find the existing card `cn(...)` and update it:

```typescript
                        className={cn(
                          "rounded-lg border bg-card p-3 shadow-sm transition-all",
                          isDragging ? "opacity-30 ring-2 ring-primary scale-95" : "hover:shadow-md hover:border-primary/30",
                          draggingDealId ? "cursor-grabbing" : "cursor-pointer",
                          !isDragging && staleness(deal.lastStageChangeAt, deal.lastActivityAt) === "stale" && "border-destructive/40",
                          !isDragging && staleness(deal.lastStageChangeAt, deal.lastActivityAt) === "aging" && "border-amber-500/40",
                        )}
```

- [ ] **Step 6: Verify build**

Run: `cd /Users/keenanabner/crm-tool && pnpm --filter web build`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/deals/components/pipeline-board.tsx
git commit -m "feat(sales): add stale deal indicators, priority dots, and quick-view callback to pipeline board"
```

---

## Task 10: Wire Everything Together — Deals Page

**Files:**
- Modify: `apps/web/src/app/(dashboard)/deals/page.tsx`

- [ ] **Step 1: Add imports for new components**

At the top of `deals/page.tsx`, add these imports (after existing imports):

```typescript
import { DealQuickView } from "./components/deal-quick-view";
import { LossReasonDialog } from "./components/loss-reason-dialog";
import { useMoveDealStage, useUpdateDeal } from "@/hooks/use-deals";
```

Note: `useMoveDealStage` and `useUpdateDeal` need to be added to the existing import from `@/hooks/use-deals`. Merge them with the existing destructured imports on line 11-17.

- [ ] **Step 2: Add state for quick-view and loss-reason dialog**

Inside `DealsPage`, after the existing state declarations (around line 49), add:

```typescript
  // Quick view
  const [quickViewDealId, setQuickViewDealId] = useState<string | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  // Loss reason dialog
  const [lossReasonOpen, setLossReasonOpen] = useState(false);
  const [lossDealId, setLossDealId] = useState<string | null>(null);
  const [lossStageId, setLossStageId] = useState<string | null>(null);
  const moveDealStage = useMoveDealStage();
  const updateDeal = useUpdateDeal();
```

- [ ] **Step 3: Add handler functions**

After the `handleCreateSubmit` function, add:

```typescript
  const handleDealClick = (dealId: string) => {
    setQuickViewDealId(dealId);
    setQuickViewOpen(true);
  };

  const handleRequestLossReason = (dealId: string, stageId: string) => {
    setLossDealId(dealId);
    setLossStageId(stageId);
    setLossReasonOpen(true);
  };

  const handleLossConfirm = (reason: string) => {
    if (lossDealId && lossStageId) {
      moveDealStage.mutate({ id: lossDealId, stageId: lossStageId });
      updateDeal.mutate({ id: lossDealId, data: { lostReason: reason } });
    }
    setLossReasonOpen(false);
    setLossDealId(null);
    setLossStageId(null);
  };
```

- [ ] **Step 4: Pass onDealClick to PipelineBoard**

Find the `<PipelineBoard pipelineId={selectedPipelineId} />` line (around line 356) and replace it with:

```tsx
          <PipelineBoard
            pipelineId={selectedPipelineId}
            onDealClick={handleDealClick}
          />
```

- [ ] **Step 5: Add the DealQuickView and LossReasonDialog at the end of the JSX**

Just before the closing `</div>` of the return statement, add:

```tsx
      {/* Quick view panel */}
      <DealQuickView
        dealId={quickViewDealId}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        onRequestLossReason={handleRequestLossReason}
      />

      {/* Loss reason dialog */}
      <LossReasonDialog
        open={lossReasonOpen}
        onOpenChange={setLossReasonOpen}
        onConfirm={handleLossConfirm}
      />
```

- [ ] **Step 6: Verify build**

Run: `cd /Users/keenanabner/crm-tool && pnpm --filter web build`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/deals/page.tsx
git commit -m "feat(sales): wire quick-view panel and loss-reason dialog into deals page"
```

---

## Task 11: Wire Activity Timeline into Deal Detail Page

**Files:**
- Modify: `apps/web/src/app/(dashboard)/deals/[id]/page.tsx`

- [ ] **Step 1: Import DealActivityTimeline**

Add this import at the top of the file:

```typescript
import { DealActivityTimeline } from "../components/deal-activity-timeline";
```

- [ ] **Step 2: Replace the activity placeholder**

Find the activity Card in the right column (around line 392-405). Replace the entire Card:

```tsx
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No activities yet
                </p>
              </CardContent>
            </Card>
```

With:

```tsx
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <DealActivityTimeline dealId={id} />
              </CardContent>
            </Card>
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/keenanabner/crm-tool && pnpm --filter web build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/deals/\[id\]/page.tsx
git commit -m "feat(sales): wire activity timeline into deal detail page"
```

---

## Task 12: Update Seed Data with New Fields

**Files:**
- Modify: `apps/api/src/database/seeds/seed.ts`

- [ ] **Step 1: Find the deal insertion code and add the new fields**

In `seed.ts`, find where deals are inserted (the deal insert block). Add `last_stage_change_at`, `last_activity_at`, and `priority` to each deal insert. The values should be randomized:

- `last_stage_change_at`: random date within last 30 days
- `last_activity_at`: random date within last 21 days (or null for ~20% of deals to create stale ones)
- `priority`: random selection from `['none', 'none', 'none', 'low', 'medium', 'high']` (weighted toward 'none')

Find the exact deal insertion query and add these columns. This will vary based on how the query builder is structured, but add the three columns to the insert values.

- [ ] **Step 2: Run the seed**

Run: `cd /Users/keenanabner/crm-tool && pnpm db:seed`
Expected: Seed completes successfully with new fields populated.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/database/seeds/seed.ts
git commit -m "feat(sales): update seed data with stage aging, activity tracking, and priority fields"
```

---

## Task 13: End-to-End Verification

- [ ] **Step 1: Start the dev environment**

Run: `cd /Users/keenanabner/crm-tool && ./start.sh`
Expected: All services start, migrations run, seed completes.

- [ ] **Step 2: Verify API returns new fields**

Run: `curl -s http://localhost:3001/api/v1/deals/pipeline/<default-pipeline-id> | jq '.stages[0].deals[0] | {lastStageChangeAt, lastActivityAt, priority}'`
Expected: All three fields present with values.

- [ ] **Step 3: Verify frontend**

Open http://localhost:3000/deals and verify:
1. Kanban board shows priority dots on deals with priority != "none"
2. Stale deals (14+ days) have red-tinted borders and pulsing red dot
3. Aging deals (7-14 days) have amber-tinted borders and amber dot
4. Clicking a deal card opens the slide-out quick-view panel (not full page navigation)
5. Quick view shows deal details, stage selector, and activity timeline
6. Clicking "open full detail" in quick view navigates to deal detail page
7. Deal detail page shows activity timeline with ability to log new activities
8. Moving a deal to a "lost" stage shows the loss reason dialog

- [ ] **Step 4: Final commit (if any fixups needed)**

```bash
git add -A
git commit -m "fix(sales): address any issues found during verification"
```

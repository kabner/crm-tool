# Sales Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Copper CRM-inspired Sales Feed page (`/sales`) as the new landing page for the Sales nav group — a unified activity stream with sidebar summary stats and upcoming tasks.

**Architecture:** Frontend-only feature that consumes the existing activities API. A new `/me` endpoint is added to the auth controller so the frontend can identify the current user. The feed page has three tabs (Following/All/Tasks), activity type and user filters, a log-activity dialog, and a right sidebar with daily summary + upcoming tasks. No new database tables or migrations.

**Tech Stack:** Next.js App Router, React Query (TanStack Query), Radix UI Dialog, Tailwind CSS, date-fns, Lucide icons, existing `apiClient`.

---

## File Map

### New Files
| File | Purpose |
|---|---|
| `apps/web/src/hooks/use-current-user.ts` | Hook to decode JWT and expose current user ID/email |
| `apps/web/src/hooks/use-feed.ts` | React Query hooks for feed tabs, filters, and summary data |
| `apps/web/src/app/(dashboard)/sales/page.tsx` | Sales Feed page — tabs, filters, feed list, sidebar |
| `apps/web/src/app/(dashboard)/sales/components/feed-item.tsx` | Single feed item card component |
| `apps/web/src/app/(dashboard)/sales/components/feed-sidebar.tsx` | Right sidebar — daily summary + upcoming tasks |
| `apps/web/src/app/(dashboard)/sales/components/log-activity-dialog.tsx` | Dialog for logging new activities from the feed |

### Modified Files
| File | Changes |
|---|---|
| `apps/api/src/shared/auth/auth.controller.ts` | Add `GET /api/v1/auth/me` endpoint |
| `apps/web/src/app/(dashboard)/layout.tsx` | Add "Feed" as first item in Sales nav section, import `Activity` icon |

---

## Task 1: Add `/me` Endpoint to Auth Controller

**Files:**
- Modify: `apps/api/src/shared/auth/auth.controller.ts`

- [ ] **Step 1: Add the `/me` GET endpoint**

Add this method to the `AuthController` class, after the `getDefaultTenant()` method (around line 36):

```typescript
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user info' })
  @ApiResponse({ status: 200, description: 'Current user info' })
  async getMe(@CurrentUser() user: RequestUser) {
    return {
      userId: user.userId,
      tenantId: user.tenantId,
      email: user.email,
    };
  }
```

Note: `JwtAuthGuard`, `CurrentUser`, and `RequestUser` are already imported in this file.

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/keenanabner/crm-tool && pnpm --filter api build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/shared/auth/auth.controller.ts
git commit -m "feat(auth): add GET /me endpoint for current user info"
```

---

## Task 2: Create `useCurrentUser` Hook

**Files:**
- Create: `apps/web/src/hooks/use-current-user.ts`

- [ ] **Step 1: Create the hook**

```typescript
// apps/web/src/hooks/use-current-user.ts
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface CurrentUser {
  userId: string;
  tenantId: string;
  email: string;
}

export function useCurrentUser() {
  return useQuery<CurrentUser>({
    queryKey: ["auth", "me"],
    queryFn: () => apiClient.get<CurrentUser>("/api/v1/auth/me"),
    staleTime: 5 * 60 * 1000, // 5 minutes — user identity doesn't change often
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/hooks/use-current-user.ts
git commit -m "feat: add useCurrentUser hook"
```

---

## Task 3: Create `use-feed` Hooks

**Files:**
- Create: `apps/web/src/hooks/use-feed.ts`

- [ ] **Step 1: Create the feed hooks file**

```typescript
// apps/web/src/hooks/use-feed.ts
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Activity, ActivityListResponse } from "@/hooks/use-activities";

export type FeedTab = "following" | "all" | "tasks";

export interface FeedFilters {
  tab: FeedTab;
  type?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

function buildFeedQueryString(
  filters: FeedFilters,
  currentUserId?: string,
): string {
  const params = new URLSearchParams();

  if (filters.tab === "following" && currentUserId) {
    params.set("userId", currentUserId);
  }
  if (filters.tab === "tasks") {
    params.set("type", "task");
    params.set("completed", "false");
    params.set("sort", "dueDate");
    params.set("order", "ASC");
    if (currentUserId) {
      params.set("userId", currentUserId);
    }
  } else {
    params.set("sort", "createdAt");
    params.set("order", "DESC");
    if (filters.type) {
      params.set("type", filters.type);
    }
  }

  if (filters.tab !== "following" && filters.tab !== "tasks" && filters.userId) {
    params.set("userId", filters.userId);
  }

  params.set("page", String(filters.page ?? 1));
  params.set("limit", String(filters.limit ?? 20));

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useFeed(filters: FeedFilters, currentUserId?: string) {
  return useQuery<ActivityListResponse>({
    queryKey: ["feed", filters, currentUserId],
    queryFn: () =>
      apiClient.get<ActivityListResponse>(
        `/api/v1/activities${buildFeedQueryString(filters, currentUserId)}`,
      ),
    enabled: filters.tab !== "following" || !!currentUserId,
  });
}

export interface FeedSummary {
  activitiesLogged: number;
  callsMade: number;
  emailsSent: number;
  tasksCompleted: number;
}

export function useFeedSummary() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return useQuery<FeedSummary>({
    queryKey: ["feed", "summary", todayStart.toISOString()],
    queryFn: async () => {
      const result = await apiClient.get<ActivityListResponse>(
        `/api/v1/activities?limit=200&sort=createdAt&order=DESC`,
      );
      const activities = result.data;
      const todayActivities = activities.filter(
        (a) => new Date(a.createdAt) >= todayStart,
      );
      return {
        activitiesLogged: todayActivities.length,
        callsMade: todayActivities.filter((a) => a.type === "call").length,
        emailsSent: todayActivities.filter((a) => a.type === "email").length,
        tasksCompleted: todayActivities.filter(
          (a) => a.type === "task" && a.completedAt,
        ).length,
      };
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/hooks/use-feed.ts
git commit -m "feat: add useFeed and useFeedSummary hooks"
```

---

## Task 4: Create Feed Item Component

**Files:**
- Create: `apps/web/src/app/(dashboard)/sales/components/feed-item.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/web/src/app/(dashboard)/sales/components/feed-item.tsx
"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  CheckSquare,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Activity } from "@/hooks/use-activities";

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
  meeting:
    "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  task: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
};

const ACTIVITY_VERBS: Record<string, string> = {
  call: "logged a call",
  email: "sent an email",
  note: "added a note",
  meeting: "logged a meeting",
  task: "created a task",
};

const USER_COLORS = [
  "bg-indigo-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-blue-500",
  "bg-teal-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
];

function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

function getInitials(firstName?: string, lastName?: string): string {
  const f = firstName?.[0] ?? "";
  const l = lastName?.[0] ?? "";
  return (f + l).toUpperCase() || "?";
}

interface FeedItemProps {
  activity: Activity;
  onComplete?: (id: string) => void;
  isCompletingId?: string | null;
}

export function FeedItem({ activity, onComplete, isCompletingId }: FeedItemProps) {
  const Icon = ACTIVITY_ICONS[activity.type] ?? MessageSquare;
  const colorClass =
    ACTIVITY_COLORS[activity.type] ?? "bg-muted text-muted-foreground";
  const verb = ACTIVITY_VERBS[activity.type] ?? "logged an activity";
  const userName = activity.user
    ? `${activity.user.firstName} ${activity.user.lastName}`
    : "System";
  const initials = getInitials(
    activity.user?.firstName,
    activity.user?.lastName,
  );
  const avatarColor = getUserColor(activity.userId);
  const isTask = activity.type === "task";
  const isCompleted = !!activity.completedAt;

  const entityLink = activity.dealId
    ? { href: `/deals/${activity.dealId}`, label: "deal" }
    : activity.contactId
      ? { href: `/contacts/${activity.contactId}`, label: "contact" }
      : activity.companyId
        ? { href: `/companies/${activity.companyId}`, label: "company" }
        : null;

  return (
    <div className="flex gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50">
      {/* User avatar */}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white",
          avatarColor,
        )}
      >
        {initials}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Header line */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {userName}
          </span>
          <span className="text-sm text-muted-foreground">{verb}</span>
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(activity.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>

        {/* Activity subject */}
        <div className="mt-1 flex items-center gap-2">
          <div
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
              colorClass,
            )}
          >
            <Icon className="h-3 w-3" />
          </div>
          <p
            className={cn(
              "text-sm",
              isTask && isCompleted && "text-muted-foreground line-through",
            )}
          >
            {activity.subject}
          </p>
        </div>

        {/* Body preview */}
        {activity.body && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {activity.body}
          </p>
        )}

        {/* Entity link */}
        {entityLink && (
          <Link
            href={entityLink.href}
            className="mt-1 inline-block text-xs text-primary hover:underline"
          >
            View {entityLink.label} →
          </Link>
        )}
      </div>

      {/* Task complete button */}
      {isTask && !isCompleted && onComplete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => onComplete(activity.id)}
          disabled={isCompletingId === activity.id}
        >
          <Check className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
mkdir -p apps/web/src/app/\(dashboard\)/sales/components
git add apps/web/src/app/\(dashboard\)/sales/components/feed-item.tsx
git commit -m "feat(sales): add FeedItem component"
```

---

## Task 5: Create Feed Sidebar Component

**Files:**
- Create: `apps/web/src/app/(dashboard)/sales/components/feed-sidebar.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/web/src/app/(dashboard)/sales/components/feed-sidebar.tsx
"use client";

import { formatDistanceToNow, isPast, isToday } from "date-fns";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUpcomingTasks, useCompleteTask } from "@/hooks/use-activities";
import { useFeedSummary } from "@/hooks/use-feed";
import { cn } from "@/lib/utils";

function formatDueLabel(dueDate: string): { label: string; className: string } {
  const date = new Date(dueDate);
  if (isPast(date) && !isToday(date)) {
    return { label: "overdue", className: "text-destructive font-medium" };
  }
  if (isToday(date)) {
    return { label: "today", className: "text-amber-600 dark:text-amber-400 font-medium" };
  }
  return {
    label: formatDistanceToNow(date, { addSuffix: true }),
    className: "text-muted-foreground",
  };
}

interface FeedSidebarProps {
  onViewAllTasks: () => void;
}

export function FeedSidebar({ onViewAllTasks }: FeedSidebarProps) {
  const { data: summary, isLoading: summaryLoading } = useFeedSummary();
  const { data: tasks, isLoading: tasksLoading } = useUpcomingTasks();
  const completeTask = useCompleteTask();

  return (
    <div className="w-[280px] shrink-0 space-y-4">
      {/* Today's Summary */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Today&apos;s Summary
        </h3>
        {summaryLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Activities logged</span>
              <span className="font-medium text-foreground">
                {summary?.activitiesLogged ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Calls made</span>
              <span className="font-medium text-foreground">
                {summary?.callsMade ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Emails sent</span>
              <span className="font-medium text-foreground">
                {summary?.emailsSent ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tasks completed</span>
              <span className="font-medium text-foreground">
                {summary?.tasksCompleted ?? 0}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Tasks */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Upcoming Tasks
        </h3>
        {tasksLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : !tasks || tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming tasks</p>
        ) : (
          <div className="space-y-2">
            {tasks.slice(0, 5).map((task) => {
              const due = task.dueDate
                ? formatDueLabel(task.dueDate)
                : null;
              return (
                <div
                  key={task.id}
                  className="flex items-start gap-2"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0 mt-0.5"
                    onClick={() => completeTask.mutate(task.id)}
                    disabled={completeTask.isPending}
                  >
                    {completeTask.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                  </Button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">
                      {task.subject}
                    </p>
                    {due && (
                      <p className={cn("text-xs", due.className)}>
                        {due.label}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            {tasks.length > 5 && (
              <button
                onClick={onViewAllTasks}
                className="text-xs text-primary hover:underline"
              >
                View all {tasks.length} tasks →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/sales/components/feed-sidebar.tsx
git commit -m "feat(sales): add FeedSidebar component"
```

---

## Task 6: Create Log Activity Dialog

**Files:**
- Create: `apps/web/src/app/(dashboard)/sales/components/log-activity-dialog.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/web/src/app/(dashboard)/sales/components/log-activity-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateActivity } from "@/hooks/use-activities";
import { X } from "lucide-react";

const ACTIVITY_TYPES = [
  { value: "note", label: "Note" },
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "task", label: "Task" },
];

interface LogActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogActivityDialog({
  open,
  onOpenChange,
}: LogActivityDialogProps) {
  const [type, setType] = useState("note");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const createActivity = useCreateActivity();

  useEffect(() => {
    if (!open) {
      setType("note");
      setSubject("");
      setBody("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!subject.trim()) return;
    await createActivity.mutateAsync({
      type,
      subject: subject.trim(),
      body: body.trim() || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              Log Activity
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-sm p-1 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-4">
            {/* Activity type */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Subject
              </label>
              <Input
                placeholder="What happened?"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
              />
            </div>

            {/* Body */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Details (optional)
              </label>
              <textarea
                placeholder="Add more context..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!subject.trim() || createActivity.isPending}
            >
              {createActivity.isPending ? "Saving..." : "Save Activity"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/sales/components/log-activity-dialog.tsx
git commit -m "feat(sales): add LogActivityDialog component"
```

---

## Task 7: Create Sales Feed Page

**Files:**
- Create: `apps/web/src/app/(dashboard)/sales/page.tsx`

- [ ] **Step 1: Create the main page**

```tsx
// apps/web/src/app/(dashboard)/sales/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Plus, RefreshCw } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useFeed, type FeedTab } from "@/hooks/use-feed";
import { useCompleteTask } from "@/hooks/use-activities";
import { FeedItem } from "./components/feed-item";
import { FeedSidebar } from "./components/feed-sidebar";
import { LogActivityDialog } from "./components/log-activity-dialog";

const TABS: { id: FeedTab; label: string }[] = [
  { id: "following", label: "Following" },
  { id: "all", label: "All Activity" },
  { id: "tasks", label: "Tasks" },
];

const ACTIVITY_TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "note", label: "Notes" },
  { value: "call", label: "Calls" },
  { value: "email", label: "Emails" },
  { value: "meeting", label: "Meetings" },
  { value: "task", label: "Tasks" },
];

export default function SalesFeedPage() {
  const [activeTab, setActiveTab] = useState<FeedTab>("following");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [logDialogOpen, setLogDialogOpen] = useState(false);

  const { data: currentUser } = useCurrentUser();
  const { data, isLoading, isFetching, refetch } = useFeed(
    {
      tab: activeTab,
      type: typeFilter || undefined,
      page,
      limit: 20,
    },
    currentUser?.userId,
  );
  const completeTask = useCompleteTask();

  const activities = data?.data ?? [];
  const total = data?.total ?? 0;
  const hasMore = activities.length === 20 && page * 20 < total;

  const handleTabChange = (tab: FeedTab) => {
    setActiveTab(tab);
    setPage(1);
    setTypeFilter("");
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales Feed</h1>
          <p className="text-sm text-muted-foreground">
            Stay on top of your team&apos;s sales activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn("h-4 w-4", isFetching && "animate-spin")}
            />
          </Button>
          <Button onClick={() => setLogDialogOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Log Activity
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex items-center gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}

        {/* Filters — hide on Tasks tab */}
        {activeTab !== "tasks" && (
          <div className="ml-4 flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="flex h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {ACTIVITY_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className="flex gap-6">
        {/* Feed */}
        <div className="min-w-0 flex-1 space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-3 rounded-lg border border-border bg-card p-4"
              >
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))
          ) : activities.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
              <p className="text-sm text-muted-foreground">
                {activeTab === "following"
                  ? "No activity on your deals yet. Log your first activity!"
                  : activeTab === "tasks"
                    ? "No pending tasks. You're all caught up!"
                    : "No activity recorded yet."}
              </p>
            </div>
          ) : (
            <>
              {activities.map((activity) => (
                <FeedItem
                  key={activity.id}
                  activity={activity}
                  onComplete={
                    activity.type === "task" && !activity.completedAt
                      ? (id) => completeTask.mutate(id)
                      : undefined
                  }
                  isCompletingId={
                    completeTask.isPending
                      ? (completeTask.variables as string)
                      : null
                  }
                />
              ))}

              {/* Pagination */}
              <div className="flex items-center justify-center gap-4 pt-2">
                {page > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                )}
                {hasMore && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Load more
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Sidebar — hide on Tasks tab since it's redundant */}
        {activeTab !== "tasks" && (
          <FeedSidebar onViewAllTasks={() => handleTabChange("tasks")} />
        )}
      </div>

      <LogActivityDialog
        open={logDialogOpen}
        onOpenChange={setLogDialogOpen}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/sales/page.tsx
git commit -m "feat(sales): add Sales Feed page"
```

---

## Task 8: Add Feed to Sidebar Navigation

**Files:**
- Modify: `apps/web/src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Add `Activity` icon import**

In the import block from `lucide-react` (line 7–34), add `Activity` to the import list:

```typescript
import {
  Activity,
  LayoutDashboard,
  // ... rest of existing imports
```

- [ ] **Step 2: Add "Feed" as the first item in the Sales section**

In the `navSections` array, update the Sales section (around line 58-63):

```typescript
  {
    section: "Sales",
    items: [
      { label: "Feed", href: "/sales", icon: Activity },
      { label: "Deals", href: "/deals", icon: Handshake },
      { label: "Sequences", href: "/sequences", icon: GitBranch },
      { label: "Lists", href: "/lists", icon: ListFilter },
    ],
  },
```

- [ ] **Step 3: Verify the frontend compiles**

Run: `cd /Users/keenanabner/crm-tool && pnpm --filter web build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/layout.tsx
git commit -m "feat(nav): add Sales Feed to sidebar navigation"
```

---

## Task 9: Local Smoke Test

- [ ] **Step 1: Start the full stack**

Run: `cd /Users/keenanabner/crm-tool && ./start.sh`

- [ ] **Step 2: Verify the Sales Feed page loads**

Open `http://localhost:3000/sales` in the browser. Verify:
- Page loads without errors
- "Following" tab is selected by default
- Sidebar shows "Today's Summary" and "Upcoming Tasks" cards
- Activity feed items render with avatars, timestamps, and icons
- "All Activity" tab shows all activities
- "Tasks" tab shows pending tasks with checkboxes
- "Log Activity" button opens the dialog
- Activity type filter dropdown works
- Tab switching resets filters and page

- [ ] **Step 3: Verify sidebar navigation**

Check that:
- "Feed" appears as the first item under the Sales section in the sidebar
- Clicking "Feed" navigates to `/sales`
- The nav item highlights when on the `/sales` route

- [ ] **Step 4: Test logging an activity**

Click "Log Activity", fill in a note, save. Verify the new activity appears in the feed after refresh.

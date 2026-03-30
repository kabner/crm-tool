"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useWorkflows,
  useCreateWorkflow,
  type CreateWorkflowInput,
} from "@/hooks/use-workflows";
import { Plus, Search, Zap } from "lucide-react";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  paused:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  archived: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const triggerLabels: Record<string, string> = {
  form_submission: "Form Submission",
  list_membership: "List Membership",
  property_change: "Property Change",
  manual: "Manual",
};

export default function AutomationPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTriggerType, setNewTriggerType] = useState<
    "form_submission" | "list_membership" | "property_change" | "manual"
  >("manual");

  const { data, isLoading } = useWorkflows({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
  });

  const createWorkflow = useCreateWorkflow();

  const debounceTimer = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (debounceTimer[0]) clearTimeout(debounceTimer[0]);
      debounceTimer[0] = setTimeout(() => {
        setDebouncedSearch(value);
        setPage(1);
      }, 300);
    },
    [debounceTimer],
  );

  const handleRowClick = (id: string) => {
    router.push(`/automation/${id}`);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const input: CreateWorkflowInput = {
      name: newName.trim(),
      description: newDescription.trim() || undefined,
      triggerConfig: {
        type: newTriggerType,
        conditions: {},
      },
    };
    const created = await createWorkflow.mutateAsync(input);
    setShowCreateForm(false);
    setNewName("");
    setNewDescription("");
    setNewTriggerType("manual");
    router.push(`/automation/${created.id}`);
  };

  const workflows = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automation</h1>
          <p className="text-muted-foreground">
            Create and manage automated workflows for your contacts.
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="mr-2 h-4 w-4" />
          {showCreateForm ? "Cancel" : "Create Workflow"}
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <Input
                placeholder="e.g. Welcome sequence"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Description (optional)
              </label>
              <Input
                placeholder="What does this workflow do?"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Trigger Type
              </label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={newTriggerType}
                onChange={(e) =>
                  setNewTriggerType(
                    e.target.value as typeof newTriggerType,
                  )
                }
              >
                <option value="manual">Manual</option>
                <option value="form_submission">Form Submission</option>
                <option value="list_membership">List Membership</option>
                <option value="property_change">Property Change</option>
              </select>
            </div>
            <Button
              onClick={handleCreate}
              disabled={!newName.trim() || createWorkflow.isPending}
            >
              {createWorkflow.isPending ? "Creating..." : "Create Workflow"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search workflows..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Trigger</th>
                  <th className="px-6 py-3 font-medium">Enrolled</th>
                  <th className="px-6 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-6 py-4">
                        <Skeleton className="h-5 w-40" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-5 w-16" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-5 w-28" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-5 w-10" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-5 w-24" />
                      </td>
                    </tr>
                  ))
                ) : workflows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      <Zap className="mx-auto mb-3 h-10 w-10 opacity-40" />
                      <p className="text-lg font-medium">No workflows yet</p>
                      <p className="text-sm">
                        Create your first automation workflow to get started.
                      </p>
                    </td>
                  </tr>
                ) : (
                  workflows.map((wf) => (
                    <tr
                      key={wf.id}
                      className="cursor-pointer border-b transition-colors hover:bg-muted/50"
                      onClick={() => handleRowClick(wf.id)}
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium">{wf.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={statusColors[wf.status] ?? statusColors.draft}
                          variant="secondary"
                        >
                          {wf.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {triggerLabels[wf.triggerConfig?.type] ?? wf.triggerConfig?.type}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {wf.enrolledCount ?? 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(wf.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(meta.page - 1) * meta.limit + 1} to{" "}
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}{" "}
            workflows
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {meta.page} of {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

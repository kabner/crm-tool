"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useForms, useCreateForm } from "@/hooks/use-forms";
import { FormBuilder } from "./components/form-builder";
import type { FormField, CreateFormInput } from "@/hooks/use-forms";

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  published: "default",
  draft: "secondary",
  archived: "destructive",
};

export default function FormsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFormName, setNewFormName] = useState("");
  const [newFormFields, setNewFormFields] = useState<FormField[]>([]);

  const { data, isLoading } = useForms({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
  });

  const createForm = useCreateForm();

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
    router.push(`/forms/${id}`);
  };

  const handleCreateSubmit = async () => {
    if (!newFormName.trim() || newFormFields.length === 0) return;
    const input: CreateFormInput = {
      name: newFormName,
      fields: newFormFields,
    };
    const created = await createForm.mutateAsync(input);
    setShowCreateForm(false);
    setNewFormName("");
    setNewFormFields([]);
    router.push(`/forms/${created.id}`);
  };

  const forms = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Forms</h1>
          <p className="text-muted-foreground">
            Create and manage forms to capture leads.
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? "Cancel" : "Create Form"}
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Form</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Form Name</label>
              <Input
                placeholder="e.g. Contact Us, Newsletter Signup"
                value={newFormName}
                onChange={(e) => setNewFormName(e.target.value)}
              />
            </div>
            <FormBuilder
              onChange={(fields) => setNewFormFields(fields)}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewFormName("");
                  setNewFormFields([]);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateSubmit}
                disabled={
                  !newFormName.trim() ||
                  newFormFields.length === 0 ||
                  createForm.isPending
                }
              >
                {createForm.isPending ? "Creating..." : "Create Form"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search forms..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="rounded-md border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Submissions
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-40" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-5 w-16" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-12" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-24" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : forms.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-md border border-border">
          <p className="text-sm text-muted-foreground">No forms found</p>
        </div>
      ) : (
        <div className="rounded-md border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Submissions
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {forms.map((form) => (
                <tr
                  key={form.id}
                  onClick={() => handleRowClick(form.id)}
                  className="cursor-pointer border-b border-border transition-colors hover:bg-muted/50"
                >
                  <td className="px-4 py-3 text-sm font-medium">{form.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[form.status] || "secondary"}>
                      {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {form.submissionCount}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(form.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(meta.page - 1) * meta.limit + 1} to{" "}
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} forms
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

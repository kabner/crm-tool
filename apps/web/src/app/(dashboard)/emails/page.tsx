"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useEmails,
  useCreateEmail,
  useDuplicateEmail,
  type MarketingEmail,
} from "@/hooks/use-emails";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  scheduled: "bg-blue-100 text-blue-800",
  sending: "bg-yellow-100 text-yellow-800",
  sent: "bg-green-100 text-green-800",
};

const STATUS_TABS = ["all", "draft", "sent", "scheduled"] as const;

function formatDate(date: string | null): string {
  if (!date) return "--";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPercent(value: number | undefined): string {
  if (value == null) return "--";
  return `${value.toFixed(1)}%`;
}

export default function EmailsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading } = useEmails({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const createEmail = useCreateEmail();
  const duplicateEmail = useDuplicateEmail();

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

  const handleCreate = async () => {
    const email = await createEmail.mutateAsync({
      name: "Untitled Email",
    });
    router.push(`/emails/${email.id}`);
  };

  const handleDuplicate = async (
    e: React.MouseEvent,
    emailId: string,
  ) => {
    e.stopPropagation();
    await duplicateEmail.mutateAsync(emailId);
  };

  const emails = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Emails</h1>
          <p className="text-muted-foreground">
            Create and manage your email marketing campaigns.
          </p>
        </div>
        <Button onClick={handleCreate} disabled={createEmail.isPending}>
          <Plus className="mr-2 h-4 w-4" />
          Create Email
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setStatusFilter(tab);
              setPage(1);
            }}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === tab
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search emails..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Subject
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Send Type
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Sent Date
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Open Rate
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Click Rate
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-4 py-3" colSpan={8}>
                        <Skeleton className="h-5 w-full" />
                      </td>
                    </tr>
                  ))
                ) : emails.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-muted-foreground"
                      colSpan={8}
                    >
                      No emails found. Create your first email to get started.
                    </td>
                  </tr>
                ) : (
                  emails.map((email: MarketingEmail & { openRate?: number; clickRate?: number }) => (
                    <tr
                      key={email.id}
                      className="cursor-pointer border-b transition-colors hover:bg-muted/50"
                      onClick={() => router.push(`/emails/${email.id}`)}
                    >
                      <td className="px-4 py-3 font-medium">
                        {email.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {email.subject || "--"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            STATUS_STYLES[email.status] ||
                            "bg-gray-100 text-gray-800"
                          }
                        >
                          {email.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {email.sendType || "--"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(email.sentAt)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatPercent(email.openRate)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatPercent(email.clickRate)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => handleDuplicate(e, email.id)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Duplicate email"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
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
            emails
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

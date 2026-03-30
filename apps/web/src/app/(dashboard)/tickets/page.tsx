"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTickets, useCreateTicket, useTicketStats } from "@/hooks/use-tickets";
import { TicketForm } from "./components/ticket-form";
import { cn } from "@/lib/utils";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "open", label: "Open" },
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  open: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  resolved: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  normal: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

export default function TicketsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data, isLoading } = useTickets({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
  });

  const { data: stats } = useTicketStats();
  const createTicket = useCreateTicket();

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

  const handleCreateSubmit = async (formData: {
    subject: string;
    contactId: string;
    priority?: string;
    categoryId?: string;
    initialMessage?: string;
  }) => {
    await createTicket.mutateAsync(formData);
    setShowCreateForm(false);
  };

  const handleStatusTab = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  const tickets = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground">
            Manage support tickets and customer inquiries.
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="mr-2 h-4 w-4" />
          {showCreateForm ? "Cancel" : "Create Ticket"}
        </Button>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Open</p>
              <p className="text-2xl font-bold">{stats.open}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Resolved</p>
              <p className="text-2xl font-bold">{stats.resolved}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Avg Response</p>
              <p className="text-2xl font-bold">
                {stats.avgResponseTime != null
                  ? `${stats.avgResponseTime}m`
                  : "--"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Avg Resolution</p>
              <p className="text-2xl font-bold">
                {stats.avgResolutionTime != null
                  ? `${stats.avgResolutionTime}m`
                  : "--"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Ticket</CardTitle>
          </CardHeader>
          <CardContent>
            <TicketForm
              onSubmit={handleCreateSubmit}
              isLoading={createTicket.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="space-y-4">
        {/* Status tabs */}
        <div className="flex gap-1 border-b border-border">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleStatusTab(tab.value)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                statusFilter === tab.value
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Input
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="max-w-sm"
          />
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Tickets table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                    #
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                    Subject
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                    Category
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-muted-foreground">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : tickets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No tickets found.
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      onClick={() => router.push(`/tickets/${ticket.id}`)}
                      className="cursor-pointer border-b border-border transition-colors hover:bg-muted/50"
                    >
                      <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                        {ticket.number}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {ticket.subject}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={cn(
                            "capitalize",
                            STATUS_COLORS[ticket.status] ?? "",
                          )}
                          variant="secondary"
                        >
                          {ticket.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={cn(
                            "capitalize",
                            PRIORITY_COLORS[ticket.priority] ?? "",
                          )}
                          variant="secondary"
                        >
                          {ticket.priority}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {ticket.category?.name ?? "--"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(meta.page - 1) * meta.limit + 1} to{" "}
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}{" "}
            tickets
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

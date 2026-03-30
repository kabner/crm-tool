"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useContacts, useCreateContact } from "@/hooks/use-contacts";
import { ContactsTable } from "./components/contacts-table";
import { ContactForm } from "./components/contact-form";

const LIFECYCLE_STAGES = [
  "All",
  "Subscriber",
  "Lead",
  "MQL",
  "SQL",
  "Opportunity",
  "Customer",
  "Evangelist",
] as const;

const LEAD_STATUSES = [
  "All",
  "New",
  "Attempting Contact",
  "Connected",
  "Qualified",
  "Unqualified",
] as const;

export default function ContactsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Filters
  const [lifecycleStage, setLifecycleStage] = useState("All");
  const [leadStatus, setLeadStatus] = useState("All");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [tagsFilter, setTagsFilter] = useState("");

  const { data, isLoading } = useContacts({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    lifecycleStage: lifecycleStage !== "All" ? lifecycleStage.toLowerCase() : undefined,
    leadStatus: leadStatus !== "All" ? leadStatus.toLowerCase() : undefined,
    ownerId: ownerFilter || undefined,
    tags: tagsFilter || undefined,
  });

  const createContact = useCreateContact();

  // Debounced search
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
    router.push(`/contacts/${id}`);
  };

  const handleCreateSubmit = async (formData: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    lifecycleStage?: string;
    leadStatus?: string;
    tags?: string[];
    source?: string;
  }) => {
    await createContact.mutateAsync(formData);
    setShowCreateForm(false);
  };

  const contacts = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">
            Manage your contacts and their information.
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? "Cancel" : "Create Contact"}
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactForm
              onSubmit={handleCreateSubmit}
              isLoading={createContact.isPending}
            />
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={lifecycleStage}
            onChange={(e) => { setLifecycleStage(e.target.value); setPage(1); }}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {LIFECYCLE_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {stage === "All" ? "All Stages" : stage}
              </option>
            ))}
          </select>

          <select
            value={leadStatus}
            onChange={(e) => { setLeadStatus(e.target.value); setPage(1); }}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {LEAD_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status === "All" ? "All Statuses" : status}
              </option>
            ))}
          </select>

          <Input
            placeholder="Owner ID..."
            value={ownerFilter}
            onChange={(e) => { setOwnerFilter(e.target.value); setPage(1); }}
            className="w-40"
          />

          <Input
            placeholder="Filter by tag..."
            value={tagsFilter}
            onChange={(e) => { setTagsFilter(e.target.value); setPage(1); }}
            className="w-40"
          />

          {(lifecycleStage !== "All" || leadStatus !== "All" || ownerFilter || tagsFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLifecycleStage("All");
                setLeadStatus("All");
                setOwnerFilter("");
                setTagsFilter("");
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      <ContactsTable
        contacts={contacts}
        isLoading={isLoading}
        onRowClick={handleRowClick}
      />

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(meta.page - 1) * meta.limit + 1} to{" "}
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}{" "}
            contacts
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

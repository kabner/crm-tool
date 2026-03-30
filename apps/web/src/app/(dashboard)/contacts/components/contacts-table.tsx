"use client";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Contact } from "@/hooks/use-contacts";

const LIFECYCLE_STAGE_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  subscriber: "outline",
  lead: "secondary",
  mql: "secondary",
  sql: "default",
  opportunity: "default",
  customer: "default",
  evangelist: "default",
};

interface ContactsTableProps {
  contacts: Contact[];
  isLoading: boolean;
  onRowClick: (id: string) => void;
}

export function ContactsTable({
  contacts,
  isLoading,
  onRowClick,
}: ContactsTableProps) {
  if (isLoading) {
    return (
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="min-w-[800px] w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Email
              </th>
              <th className="hidden md:table-cell px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Phone
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Lifecycle Stage
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Owner
              </th>
              <th className="hidden md:table-cell px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Created At
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-32" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-40" />
                </td>
                <td className="hidden md:table-cell px-4 py-3">
                  <Skeleton className="h-4 w-28" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-5 w-20" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="hidden md:table-cell px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-md border border-border">
        <p className="text-sm text-muted-foreground">No contacts found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="min-w-[800px] w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Name
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Email
            </th>
            <th className="hidden md:table-cell px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Phone
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Lifecycle Stage
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Owner
            </th>
            <th className="hidden md:table-cell px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Created At
            </th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr
              key={contact.id}
              onClick={() => onRowClick(contact.id)}
              className="cursor-pointer border-b border-border transition-colors hover:bg-muted/50"
            >
              <td className="px-4 py-3 text-sm font-medium">
                {contact.firstName} {contact.lastName}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {contact.email ?? "-"}
              </td>
              <td className="hidden md:table-cell px-4 py-3 text-sm text-muted-foreground">
                {contact.phone ?? "-"}
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant={
                    LIFECYCLE_STAGE_VARIANT[contact.lifecycleStage] ?? "outline"
                  }
                >
                  {contact.lifecycleStage}
                </Badge>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {contact.ownerId ?? "-"}
              </td>
              <td className="hidden md:table-cell px-4 py-3 text-sm text-muted-foreground">
                {new Date(contact.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

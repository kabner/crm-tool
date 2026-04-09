"use client";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import type { Deal } from "@/hooks/use-deals";

interface DealsTableProps {
  deals: Deal[];
  isLoading: boolean;
  onRowClick: (id: string) => void;
}

function isPastDue(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const closeDate = new Date(dateStr);
  closeDate.setHours(0, 0, 0, 0);
  return closeDate < today;
}

function stageBadgeVariant(
  stageType: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (stageType) {
    case "won":
      return "default";
    case "lost":
      return "destructive";
    default:
      return "secondary";
  }
}

const COLUMNS = [
  "Name",
  "Amount",
  "Stage",
  "Pipeline",
  "Close Date",
  "Company",
  "Owner",
  "Created At",
];

export function DealsTable({ deals, isLoading, onRowClick }: DealsTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {COLUMNS.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-36" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-20" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-5 w-24" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-28" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-28" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-md border border-border">
        <p className="text-sm text-muted-foreground">No deals found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {COLUMNS.map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => {
            const isOpen = deal.stage?.stageType === "open";
            const pastDue =
              isOpen && deal.closeDate ? isPastDue(deal.closeDate) : false;

            return (
              <tr
                key={deal.id}
                onClick={() => onRowClick(deal.id)}
                className="cursor-pointer border-b border-border transition-colors hover:bg-muted/50"
              >
                <td className="px-4 py-3 text-sm font-medium">
                  {deal.name}
                </td>
                <td className="px-4 py-3 text-sm font-medium">
                  {deal.amount != null ? formatCurrency(deal.amount, deal.currency) : "-"}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={stageBadgeVariant(deal.stage?.stageType ?? "open")}
                  >
                    {deal.stage?.name ?? "-"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {deal.pipeline?.name ?? deal.stage?.pipeline?.name ?? "-"}
                </td>
                <td
                  className={cn(
                    "px-4 py-3 text-sm",
                    pastDue
                      ? "font-medium text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {deal.closeDate
                    ? new Date(deal.closeDate).toLocaleDateString()
                    : "-"}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {deal.company?.name ?? "-"}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {deal.owner
                    ? `${deal.owner.firstName} ${deal.owner.lastName}`
                    : "-"}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(deal.createdAt).toLocaleDateString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

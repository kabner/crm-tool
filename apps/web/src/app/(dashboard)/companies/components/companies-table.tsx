"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Company } from "@/hooks/use-companies";

interface CompaniesTableProps {
  companies: Company[];
  isLoading: boolean;
}

export function CompaniesTable({ companies, isLoading }: CompaniesTableProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <div className="min-w-[700px] grid grid-cols-6 gap-4 border-b border-border px-6 py-3 text-sm font-medium text-muted-foreground">
          <div>Name</div>
          <div>Domain</div>
          <div>Industry</div>
          <div>Size</div>
          <div className="hidden md:block">Phone</div>
          <div className="hidden md:block">Created At</div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="min-w-[700px] grid grid-cols-6 gap-4 border-b border-border px-6 py-4 last:border-b-0"
          >
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="hidden md:block h-5 w-28" />
            <Skeleton className="hidden md:block h-5 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card py-16">
        <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">No companies found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Get started by creating your first company.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <div className="min-w-[700px] grid grid-cols-6 gap-4 border-b border-border px-6 py-3 text-sm font-medium text-muted-foreground">
        <div>Name</div>
        <div>Domain</div>
        <div>Industry</div>
        <div>Size</div>
        <div className="hidden md:block">Phone</div>
        <div className="hidden md:block">Created At</div>
      </div>
      {companies.map((company) => (
        <div
          key={company.id}
          onClick={() => router.push(`/companies/${company.id}`)}
          className="min-w-[700px] grid cursor-pointer grid-cols-6 gap-4 border-b border-border px-6 py-4 transition-colors hover:bg-muted/50 last:border-b-0"
        >
          <div className="font-medium">{company.name}</div>
          <div className="text-sm text-muted-foreground">
            {company.domain || "-"}
          </div>
          <div>
            {company.industry ? (
              <Badge variant="secondary">{company.industry}</Badge>
            ) : (
              <span className="text-sm text-muted-foreground">-</span>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {company.size || "-"}
          </div>
          <div className="hidden md:block text-sm text-muted-foreground">
            {company.phone || "-"}
          </div>
          <div className="hidden md:block text-sm text-muted-foreground">
            {format(new Date(company.createdAt), "MMM d, yyyy")}
          </div>
        </div>
      ))}
    </div>
  );
}

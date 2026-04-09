"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";

interface DealCardDeal {
  id: string;
  name: string;
  amount: number | null;
  currency?: string;
  closeDate: string | null;
  owner: { firstName: string; lastName: string } | null;
  company: { name: string } | null;
}

interface DealCardProps {
  deal: DealCardDeal;
  onDragStart: (e: React.DragEvent, dealId: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

function isPastDue(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const closeDate = new Date(dateStr);
  closeDate.setHours(0, 0, 0, 0);
  return closeDate < today;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function DealCard({ deal, onDragStart, onDragEnd }: DealCardProps) {
  const router = useRouter();
  const wasDragging = useRef(false);

  const handleDragStart = (e: React.DragEvent) => {
    wasDragging.current = true;
    onDragStart(e, deal.id);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    onDragEnd?.(e);
    // Keep wasDragging true briefly so onClick can check it
    setTimeout(() => {
      wasDragging.current = false;
    }, 100);
  };

  const handleClick = () => {
    // Don't navigate if we just finished a drag
    if (wasDragging.current) return;
    router.push(`/deals/${deal.id}`);
  };

  const pastDue = deal.closeDate ? isPastDue(deal.closeDate) : false;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      className="group cursor-pointer rounded-lg border border-border bg-card p-3 shadow-sm transition-all hover:shadow-md hover:border-primary/30 active:shadow-sm"
    >
      {/* Deal name */}
      <p className="text-sm font-semibold text-foreground truncate leading-tight">
        {deal.name}
      </p>

      {/* Company */}
      {deal.company && (
        <p className="mt-1 text-xs text-muted-foreground truncate">
          {deal.company.name}
        </p>
      )}

      {/* Amount */}
      {deal.amount != null && (
        <p className="mt-2 text-base font-bold text-foreground">
          {formatCurrency(Number(deal.amount), deal.currency)}
        </p>
      )}

      {/* Footer: close date + owner */}
      <div className="mt-2 flex items-center justify-between">
        {deal.closeDate ? (
          <span
            className={cn(
              "text-xs",
              pastDue
                ? "font-medium text-destructive"
                : "text-muted-foreground",
            )}
          >
            {pastDue && "Overdue: "}
            {new Date(deal.closeDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        ) : (
          <span />
        )}

        {deal.owner && (
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary"
            title={`${deal.owner.firstName} ${deal.owner.lastName}`}
          >
            {getInitials(deal.owner.firstName, deal.owner.lastName)}
          </div>
        )}
      </div>
    </div>
  );
}

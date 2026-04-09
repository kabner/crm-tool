"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { useDeal, useMoveDealStage, usePipeline } from "@/hooks/use-deals";
import { DealActivityTimeline } from "./deal-activity-timeline";
import { ExternalLink, Clock, Building2, User, CalendarDays, TrendingUp } from "lucide-react";

function daysInStage(lastStageChangeAt: string | null): number | null {
  if (!lastStageChangeAt) return null;
  const diff = Date.now() - new Date(lastStageChangeAt).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

const PRIORITY_BADGE: Record<string, { label: string; className: string }> = {
  high: { label: "High", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  medium: { label: "Medium", className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  low: { label: "Low", className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
};

interface DealQuickViewProps {
  dealId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestLossReason?: (dealId: string, stageId: string) => void;
}

export function DealQuickView({ dealId, open, onOpenChange, onRequestLossReason }: DealQuickViewProps) {
  const router = useRouter();
  const { data: deal, isLoading } = useDeal(dealId ?? "");
  const moveDealStage = useMoveDealStage();

  const pipelineId = deal?.pipeline?.id ?? deal?.stage?.pipeline?.id ?? "";
  const { data: pipeline } = usePipeline(pipelineId);

  const stages = pipeline?.stages
    ? [...pipeline.stages].sort((a, b) => a.position - b.position)
    : [];

  const handleStageChange = (stageId: string) => {
    if (!dealId) return;
    const targetStage = stages.find((s) => s.id === stageId);
    if (targetStage?.stageType === "lost" && onRequestLossReason) {
      onRequestLossReason(dealId, stageId);
      return;
    }
    moveDealStage.mutate({ id: dealId, stageId });
  };

  const days = deal?.lastStageChangeAt ? daysInStage(deal.lastStageChangeAt) : null;
  const priorityInfo = deal?.priority ? PRIORITY_BADGE[deal.priority] : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="max-w-md">
        {isLoading || !deal ? (
          <SheetHeader>
            <Skeleton className="h-6 w-48" />
          </SheetHeader>
        ) : (
          <>
            <SheetHeader>
              <div className="flex items-start justify-between pr-8">
                <div>
                  <SheetTitle>{deal.name}</SheetTitle>
                  {deal.amount != null && (
                    <p className="text-lg font-bold text-foreground mt-0.5">
                      {formatCurrency(deal.amount, deal.currency)}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    onOpenChange(false);
                    router.push(`/deals/${deal.id}`);
                  }}
                  title="Open full detail"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge
                  variant={
                    deal.stage?.stageType === "won"
                      ? "default"
                      : deal.stage?.stageType === "lost"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {deal.stage?.name}
                </Badge>
                {priorityInfo && (
                  <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", priorityInfo.className)}>
                    {priorityInfo.label} Priority
                  </span>
                )}
                {days != null && (
                  <span className={cn(
                    "inline-flex items-center gap-1 text-xs",
                    days > 14 ? "text-destructive font-medium" : "text-muted-foreground",
                  )}>
                    <Clock className="h-3 w-3" />
                    {days}d in stage
                  </span>
                )}
              </div>
            </SheetHeader>

            <SheetBody>
              {stages.length > 0 && deal.stage?.stageType === "open" && (
                <div className="mb-6">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Move to stage</p>
                  <div className="flex gap-1 flex-wrap">
                    {stages.map((stage) => {
                      const isCurrent = stage.id === deal.stage?.id;
                      return (
                        <button
                          key={stage.id}
                          onClick={() => handleStageChange(stage.id)}
                          disabled={isCurrent || moveDealStage.isPending}
                          className={cn(
                            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors border",
                            isCurrent
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground",
                            isCurrent && "cursor-default",
                          )}
                        >
                          {stage.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-3 mb-6">
                <p className="text-xs font-medium text-muted-foreground">Details</p>
                <div className="grid grid-cols-2 gap-3">
                  {deal.company && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{deal.company.name}</span>
                    </div>
                  )}
                  {deal.owner && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{deal.owner.firstName} {deal.owner.lastName}</span>
                    </div>
                  )}
                  {deal.closeDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className={cn(
                        new Date(deal.closeDate) < new Date() && deal.stage?.stageType === "open"
                          ? "text-destructive font-medium"
                          : "",
                      )}>
                        {new Date(deal.closeDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  )}
                  {deal.stage?.probability != null && (
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{deal.stage.probability}% probability</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Activity</p>
                <DealActivityTimeline dealId={deal.id} compact />
              </div>
            </SheetBody>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

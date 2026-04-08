"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useDeal,
  useUpdateDeal,
  useDeleteDeal,
  useMoveDealStage,
  usePipeline,
} from "@/hooks/use-deals";
import { DealForm } from "../components/deal-form";
import { DealActivityTimeline } from "../components/deal-activity-timeline";
import { AttachmentsPanel } from "@/components/attachments-panel";
import { VisibilityBadge } from "@/components/visibility-badge";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function isPastDue(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const closeDate = new Date(dateStr);
  closeDate.setHours(0, 0, 0, 0);
  return closeDate < today;
}

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: deal, isLoading } = useDeal(id);
  const updateDeal = useUpdateDeal();
  const deleteDeal = useDeleteDeal();
  const moveDealStage = useMoveDealStage();

  const pipelineId = deal?.stage?.pipeline?.id ?? deal?.pipeline?.id ?? "";
  const { data: pipeline } = usePipeline(pipelineId);

  const [isEditing, setIsEditing] = useState(false);

  const stages = pipeline?.stages
    ? [...pipeline.stages].sort((a, b) => a.position - b.position)
    : [];

  const handleUpdate = async (formData: {
    name: string;
    amount?: number;
    pipelineId: string;
    stageId: string;
    closeDate?: string;
    companyName?: string;
    ownerId?: string;
  }) => {
    await updateDeal.mutateAsync({ id, data: formData });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this deal? This action cannot be undone.",
      )
    ) {
      await deleteDeal.mutateAsync(id);
      router.push("/deals");
    }
  };

  const handleStageChange = (stageId: string) => {
    moveDealStage.mutate({ id, stageId });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/deals")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Deals
        </Button>
        <p className="text-muted-foreground">Deal not found.</p>
      </div>
    );
  }

  const isOpen = deal.stage?.stageType === "open";
  const isWon = deal.stage?.stageType === "won";
  const isLost = deal.stage?.stageType === "lost";
  const pastDue =
    isOpen && deal.closeDate ? isPastDue(deal.closeDate) : false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/deals")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{deal.name}</h1>
              {deal.visibility && deal.visibility !== 'everyone' && (
                <VisibilityBadge visibility={deal.visibility} />
              )}
            </div>
            {deal.amount != null && (
              <p className="text-xl font-semibold text-muted-foreground">
                {formatCurrency(deal.amount)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isWon && (
            <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">
              Won
            </Badge>
          )}
          {isLost && <Badge variant="destructive">Lost</Badge>}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            {isEditing ? "Cancel" : "Edit"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteDeal.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stage selector (visual pipeline) */}
      {stages.length > 0 && !isEditing && (
        <div className="flex gap-1 overflow-x-auto">
          {stages.map((stage) => {
            const isCurrent = stage.id === deal.stage?.id;
            const stageType = stage.stageType;

            return (
              <button
                key={stage.id}
                onClick={() => handleStageChange(stage.id)}
                disabled={moveDealStage.isPending}
                className={cn(
                  "flex-1 min-w-0 rounded-md px-3 py-2 text-xs font-medium transition-colors border",
                  isCurrent
                    ? stageType === "won"
                      ? "bg-emerald-500 text-white border-emerald-600"
                      : stageType === "lost"
                        ? "bg-red-500 text-white border-red-600"
                        : "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground",
                )}
                title={`Move to ${stage.name}`}
              >
                <span className="truncate block">{stage.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Deal</CardTitle>
          </CardHeader>
          <CardContent>
            <DealForm
              initialData={{
                name: deal.name,
                amount: deal.amount,
                pipelineId: pipelineId,
                stageId: deal.stage?.id,
                closeDate: deal.closeDate,
                companyName: deal.company?.name,
                ownerId: deal.owner
                  ? undefined
                  : undefined,
              }}
              onSubmit={handleUpdate}
              isLoading={updateDeal.isPending}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Deal info */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Deal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Deal Name
                    </dt>
                    <dd className="mt-1 text-sm">{deal.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Amount
                    </dt>
                    <dd className="mt-1 text-sm font-semibold">
                      {deal.amount != null
                        ? formatCurrency(deal.amount)
                        : "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Stage
                    </dt>
                    <dd className="mt-1">
                      <Badge
                        variant={
                          isWon
                            ? "default"
                            : isLost
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {deal.stage?.name ?? "-"}
                      </Badge>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Pipeline
                    </dt>
                    <dd className="mt-1 text-sm">
                      {deal.pipeline?.name ??
                        deal.stage?.pipeline?.name ??
                        "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Close Date
                    </dt>
                    <dd
                      className={cn(
                        "mt-1 text-sm",
                        pastDue && "font-medium text-destructive",
                      )}
                    >
                      {deal.closeDate
                        ? new Date(deal.closeDate).toLocaleDateString()
                        : "-"}
                      {pastDue && " (Overdue)"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Probability
                    </dt>
                    <dd className="mt-1 text-sm">
                      {deal.stage?.probability != null
                        ? `${deal.stage.probability}%`
                        : "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Company
                    </dt>
                    <dd className="mt-1 text-sm">
                      {deal.company?.name ?? "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Owner
                    </dt>
                    <dd className="mt-1 text-sm">
                      {deal.owner
                        ? `${deal.owner.firstName} ${deal.owner.lastName}`
                        : "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Created
                    </dt>
                    <dd className="mt-1 text-sm">
                      {new Date(deal.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Last Updated
                    </dt>
                    <dd className="mt-1 text-sm">
                      {new Date(deal.updatedAt).toLocaleDateString()}
                    </dd>
                  </div>

                  {/* Custom properties */}
                  {deal.customProps &&
                    Object.keys(deal.customProps).length > 0 && (
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-muted-foreground">
                          Custom Properties
                        </dt>
                        <dd className="mt-1">
                          <dl className="grid grid-cols-2 gap-2">
                            {Object.entries(deal.customProps).map(
                              ([key, value]) => (
                                <div key={key}>
                                  <dt className="text-xs text-muted-foreground">
                                    {key}
                                  </dt>
                                  <dd className="text-sm">
                                    {String(value)}
                                  </dd>
                                </div>
                              ),
                            )}
                          </dl>
                        </dd>
                      </div>
                    )}
                </dl>
              </CardContent>
            </Card>
          </div>

          {/* Activity timeline */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <DealActivityTimeline dealId={id} />
              </CardContent>
            </Card>
            <AttachmentsPanel entityType="deal" entityId={id} />
          </div>
        </div>
      )}
    </div>
  );
}

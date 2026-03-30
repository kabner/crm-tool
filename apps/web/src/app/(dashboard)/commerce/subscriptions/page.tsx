"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useSubscriptions,
  useSubscriptionMetrics,
  useCancelSubscription,
} from "@/hooks/use-subscriptions";

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function statusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default";
    case "paused":
      return "outline";
    case "canceled":
      return "destructive";
    case "trialing":
      return "secondary";
    default:
      return "secondary";
  }
}

export default function SubscriptionsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const { data: metricsData, isLoading: metricsLoading } =
    useSubscriptionMetrics();
  const { data, isLoading } = useSubscriptions({
    page,
    limit: 20,
    status: statusFilter || undefined,
  });
  const cancelSubscription = useCancelSubscription();

  const subscriptions = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 };

  const handleCancel = async (id: string, immediately: boolean) => {
    const msg = immediately
      ? "Cancel this subscription immediately?"
      : "Cancel this subscription at the end of the current period?";
    if (!confirm(msg)) return;
    await cancelSubscription.mutateAsync({ id, immediately });
  };

  const statuses = ["", "active", "paused", "canceled", "trialing"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
        <p className="text-muted-foreground">
          Manage recurring subscriptions and view metrics.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">
              MRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">
                {formatMoney(metricsData?.mrr ?? 0)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">
              ARR
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">
                {formatMoney(metricsData?.arr ?? 0)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">
                {metricsData?.activeCount ?? 0}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Churn Rate (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">
                {metricsData?.churnRate ?? 0}%
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        {statuses.map((s) => (
          <Button
            key={s || "all"}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
          >
            {s || "All"}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="p-4 font-medium">ID</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Period</th>
                <th className="p-4 font-medium">Items</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-4" colSpan={5}>
                      <Skeleton className="h-5 w-full" />
                    </td>
                  </tr>
                ))}
              {!isLoading && subscriptions.length === 0 && (
                <tr>
                  <td
                    className="p-8 text-center text-muted-foreground"
                    colSpan={5}
                  >
                    No subscriptions found
                  </td>
                </tr>
              )}
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-4 font-mono text-sm">
                    {sub.id.slice(0, 8)}...
                  </td>
                  <td className="p-4">
                    <Badge variant={statusBadgeVariant(sub.status)}>
                      {sub.status}
                    </Badge>
                    {sub.cancelAtPeriodEnd && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (cancels at period end)
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(sub.currentPeriodStart).toLocaleDateString()} -{" "}
                    {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-sm">
                    {sub.items?.length ?? 0} item(s)
                  </td>
                  <td className="p-4">
                    {sub.status === "active" && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(sub.id, false)}
                          disabled={cancelSubscription.isPending}
                        >
                          Cancel at Period End
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancel(sub.id, true)}
                          disabled={cancelSubscription.isPending}
                        >
                          Cancel Now
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(meta.page - 1) * meta.limit + 1} to{" "}
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}{" "}
            subscriptions
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

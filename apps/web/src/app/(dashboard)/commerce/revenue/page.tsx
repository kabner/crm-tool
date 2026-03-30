"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useRevenueMRR,
  useRevenueARR,
  useRevenueOverTime,
  useMRRMovements,
  useRevenueLTV,
} from "@/hooks/use-revenue";

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function movementTypeBadge(
  type: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (type) {
    case "new":
      return "default";
    case "expansion":
      return "default";
    case "contraction":
      return "outline";
    case "churn":
      return "destructive";
    default:
      return "secondary";
  }
}

export default function RevenuePage() {
  const { data: mrrData, isLoading: mrrLoading } = useRevenueMRR();
  const { data: arrData, isLoading: arrLoading } = useRevenueARR();
  const { data: ltvData, isLoading: ltvLoading } = useRevenueLTV();
  const { data: movementsData, isLoading: movementsLoading } =
    useMRRMovements();

  // Default: last 12 months
  const endDate = new Date().toISOString().split("T")[0]!;
  const startDateObj = new Date();
  startDateObj.setFullYear(startDateObj.getFullYear() - 1);
  const startDate = startDateObj.toISOString().split("T")[0]!;

  const { data: revenueOverTime, isLoading: revenueLoading } =
    useRevenueOverTime(startDate, endDate, "month");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Revenue</h1>
        <p className="text-muted-foreground">
          Track your recurring revenue, growth, and customer lifetime value.
        </p>
      </div>

      {/* Top-level metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Monthly Recurring Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mrrLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">
                {formatMoney(mrrData?.mrr ?? 0)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Annual Recurring Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {arrLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">
                {formatMoney(arrData?.arr ?? 0)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Customer LTV
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ltvLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">
                {formatMoney(ltvData?.ltv ?? 0)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Avg. Lifespan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ltvLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">
                {ltvData?.avgLifespanMonths ?? 0} mo
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* MRR Movements Summary */}
      {movementsData?.summary && (
        <Card>
          <CardHeader>
            <CardTitle>MRR Movements Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">New</p>
                <p className="text-lg font-medium text-green-600">
                  +{formatMoney(movementsData.summary.new)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expansion</p>
                <p className="text-lg font-medium text-green-600">
                  +{formatMoney(movementsData.summary.expansion)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contraction</p>
                <p className="text-lg font-medium text-orange-600">
                  {formatMoney(movementsData.summary.contraction)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Churn</p>
                <p className="text-lg font-medium text-red-600">
                  {formatMoney(movementsData.summary.churn)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net</p>
                <p
                  className={`text-lg font-medium ${
                    movementsData.summary.net >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {movementsData.summary.net >= 0 ? "+" : ""}
                  {formatMoney(movementsData.summary.net)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MRR Movements List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent MRR Movements</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium text-right">Amount</th>
                <th className="p-4 font-medium">Subscription</th>
              </tr>
            </thead>
            <tbody>
              {movementsLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-4" colSpan={4}>
                      <Skeleton className="h-5 w-full" />
                    </td>
                  </tr>
                ))}
              {!movementsLoading &&
                (!movementsData?.movements ||
                  movementsData.movements.length === 0) && (
                  <tr>
                    <td
                      className="p-8 text-center text-muted-foreground"
                      colSpan={4}
                    >
                      No MRR movements yet
                    </td>
                  </tr>
                )}
              {movementsData?.movements?.slice(0, 20).map((m) => (
                <tr key={m.id} className="border-b">
                  <td className="p-4 text-sm">
                    {new Date(m.effectiveDate).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <Badge variant={movementTypeBadge(m.type)}>
                      {m.type}
                    </Badge>
                  </td>
                  <td
                    className={`p-4 text-right font-medium ${
                      m.amount >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {m.amount >= 0 ? "+" : ""}
                    {formatMoney(m.amount)}
                  </td>
                  <td className="p-4 font-mono text-sm text-muted-foreground">
                    {m.subscriptionId.slice(0, 8)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Revenue Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Over Time (Last 12 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          {revenueLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : revenueOverTime && revenueOverTime.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-2 font-medium">Period</th>
                  <th className="pb-2 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {revenueOverTime.map((entry, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2 text-sm">
                      {new Date(entry.period).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-2 text-right font-medium">
                      {formatMoney(entry.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted-foreground text-sm">
              No revenue data available for this period.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

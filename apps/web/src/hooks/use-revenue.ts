import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface MRRResponse {
  mrr: number;
}

export interface ARRResponse {
  arr: number;
}

export interface MRRMovement {
  id: string;
  subscriptionId: string;
  type: string;
  amount: number;
  effectiveDate: string;
  createdAt: string;
}

export interface MRRMovementsResponse {
  movements: MRRMovement[];
  summary: {
    new: number;
    expansion: number;
    contraction: number;
    churn: number;
    net: number;
  };
}

export interface RevenueOverTimeEntry {
  period: string;
  revenue: number;
}

export interface LTVResponse {
  ltv: number;
  avgRevenuePerCustomer: number;
  avgLifespanMonths: number;
}

export function useRevenueMRR() {
  return useQuery<MRRResponse>({
    queryKey: ["revenue", "mrr"],
    queryFn: () => apiClient.get<MRRResponse>("/api/v1/commerce/revenue/mrr"),
  });
}

export function useRevenueARR() {
  return useQuery<ARRResponse>({
    queryKey: ["revenue", "arr"],
    queryFn: () => apiClient.get<ARRResponse>("/api/v1/commerce/revenue/arr"),
  });
}

export function useRevenueOverTime(
  startDate: string,
  endDate: string,
  interval: "day" | "week" | "month" = "month",
) {
  return useQuery<RevenueOverTimeEntry[]>({
    queryKey: ["revenue", "over-time", startDate, endDate, interval],
    queryFn: () =>
      apiClient.get<RevenueOverTimeEntry[]>(
        `/api/v1/commerce/revenue/over-time?startDate=${startDate}&endDate=${endDate}&interval=${interval}`,
      ),
    enabled: !!startDate && !!endDate,
  });
}

export function useMRRMovements(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const qs = params.toString();

  return useQuery<MRRMovementsResponse>({
    queryKey: ["revenue", "mrr-movements", startDate, endDate],
    queryFn: () =>
      apiClient.get<MRRMovementsResponse>(
        `/api/v1/commerce/revenue/mrr-movements${qs ? `?${qs}` : ""}`,
      ),
  });
}

export function useRevenueLTV() {
  return useQuery<LTVResponse>({
    queryKey: ["revenue", "ltv"],
    queryFn: () => apiClient.get<LTVResponse>("/api/v1/commerce/revenue/ltv"),
  });
}

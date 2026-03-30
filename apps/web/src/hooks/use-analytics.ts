import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface SalesSummary {
  totalDeals: number;
  wonDeals: number;
  winRate: number;
  totalRevenue: number;
  avgDealSize: number;
}

export interface MarketingSummary {
  emailsSent: number;
  openRate: number;
  clickRate: number;
  formSubmissions: number;
  newLeads: number;
  newContacts: number;
}

export interface ServiceSummary {
  openTickets: number;
  ticketsCreated: number;
  ticketsResolved: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  csatScore: number;
}

export interface OverviewAnalytics {
  totalContacts: number;
  totalCompanies: number;
  openDeals: number;
  openDealsValue: number;
  openTickets: number;
  activitiesThisMonth: number;
  sales: SalesSummary;
  marketing: MarketingSummary;
  service: ServiceSummary;
}

export function useOverviewAnalytics() {
  return useQuery<OverviewAnalytics>({
    queryKey: ["analytics", "overview"],
    queryFn: () =>
      apiClient.get<OverviewAnalytics>("/api/v1/data/analytics/overview"),
  });
}

export function useSalesAnalytics(start?: string, end?: string) {
  const params = new URLSearchParams();
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  const qs = params.toString();

  return useQuery<SalesSummary>({
    queryKey: ["analytics", "sales", start, end],
    queryFn: () =>
      apiClient.get<SalesSummary>(
        `/api/v1/data/analytics/sales${qs ? `?${qs}` : ""}`,
      ),
  });
}

export function useMarketingAnalytics(start?: string, end?: string) {
  const params = new URLSearchParams();
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  const qs = params.toString();

  return useQuery<MarketingSummary>({
    queryKey: ["analytics", "marketing", start, end],
    queryFn: () =>
      apiClient.get<MarketingSummary>(
        `/api/v1/data/analytics/marketing${qs ? `?${qs}` : ""}`,
      ),
  });
}

export function useServiceAnalytics(start?: string, end?: string) {
  const params = new URLSearchParams();
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  const qs = params.toString();

  return useQuery<ServiceSummary>({
    queryKey: ["analytics", "service", start, end],
    queryFn: () =>
      apiClient.get<ServiceSummary>(
        `/api/v1/data/analytics/service${qs ? `?${qs}` : ""}`,
      ),
  });
}

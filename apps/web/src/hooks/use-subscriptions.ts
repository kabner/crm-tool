import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface SubscriptionItem {
  id: string;
  subscriptionId: string;
  productId: string;
  priceId: string;
  quantity: number;
}

export interface Subscription {
  id: string;
  tenantId: string;
  contactId: string;
  companyId: string | null;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialStart: string | null;
  trialEnd: string | null;
  canceledAt: string | null;
  cancelAtPeriodEnd: boolean;
  pauseStartedAt: string | null;
  items?: SubscriptionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionsResponse {
  data: Subscription[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SubscriptionMetrics {
  mrr: number;
  arr: number;
  activeCount: number;
  churnRate: number;
}

export interface SubscriptionFilters {
  page?: number;
  limit?: number;
  status?: string;
}

function buildQueryString(filters: SubscriptionFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useSubscriptions(filters: SubscriptionFilters = {}) {
  return useQuery<SubscriptionsResponse>({
    queryKey: ["subscriptions", filters],
    queryFn: () =>
      apiClient.get<SubscriptionsResponse>(
        `/api/v1/commerce/subscriptions${buildQueryString(filters)}`,
      ),
  });
}

export function useSubscription(id: string) {
  return useQuery<Subscription>({
    queryKey: ["subscriptions", id],
    queryFn: () =>
      apiClient.get<Subscription>(`/api/v1/commerce/subscriptions/${id}`),
    enabled: !!id,
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, immediately }: { id: string; immediately?: boolean }) =>
      apiClient.post<Subscription>(
        `/api/v1/commerce/subscriptions/${id}/cancel`,
        { immediately },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });
}

export function useSubscriptionMetrics() {
  return useQuery<SubscriptionMetrics>({
    queryKey: ["subscriptions", "metrics"],
    queryFn: () =>
      apiClient.get<SubscriptionMetrics>(
        "/api/v1/commerce/subscriptions/metrics",
      ),
  });
}

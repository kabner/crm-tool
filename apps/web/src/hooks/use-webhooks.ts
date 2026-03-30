import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface WebhookEndpoint {
  id: string;
  tenantId: string;
  url: string;
  secret: string;
  events: string[];
  filterConfig: Record<string, any> | null;
  status: string;
  createdBy: string;
  createdAt: string;
  successCount?: number;
  failCount?: number;
  recentDeliveries?: WebhookDelivery[];
}

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  eventType: string;
  payload: Record<string, any>;
  status: string;
  attempts: number;
  lastAttemptAt: string | null;
  responseStatus: number | null;
  responseBody: string | null;
  durationMs: number | null;
  nextRetryAt: string | null;
  createdAt: string;
}

export interface DeliveriesResponse {
  data: WebhookDelivery[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateWebhookInput {
  url: string;
  events: string[];
  filterConfig?: Record<string, any>;
}

export interface UpdateWebhookInput {
  url?: string;
  events?: string[];
  status?: string;
}

export function useWebhooks() {
  return useQuery<WebhookEndpoint[]>({
    queryKey: ["webhooks"],
    queryFn: () =>
      apiClient.get<WebhookEndpoint[]>("/api/v1/integrations/webhooks"),
  });
}

export function useWebhook(id: string) {
  return useQuery<WebhookEndpoint>({
    queryKey: ["webhooks", id],
    queryFn: () =>
      apiClient.get<WebhookEndpoint>(`/api/v1/integrations/webhooks/${id}`),
    enabled: !!id,
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWebhookInput) =>
      apiClient.post<WebhookEndpoint>("/api/v1/integrations/webhooks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
    },
  });
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWebhookInput }) =>
      apiClient.patch<WebhookEndpoint>(
        `/api/v1/integrations/webhooks/${id}`,
        data,
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      queryClient.invalidateQueries({
        queryKey: ["webhooks", variables.id],
      });
    },
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/v1/integrations/webhooks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
    },
  });
}

export function useWebhookDeliveries(
  endpointId: string,
  filters: { page?: number; limit?: number; status?: string } = {},
) {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.status) params.set("status", filters.status);
  const qs = params.toString();

  return useQuery<DeliveriesResponse>({
    queryKey: ["webhookDeliveries", endpointId, filters],
    queryFn: () =>
      apiClient.get<DeliveriesResponse>(
        `/api/v1/integrations/webhooks/${endpointId}/deliveries${qs ? `?${qs}` : ""}`,
      ),
    enabled: !!endpointId,
  });
}

export function useTestWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (endpointId: string) =>
      apiClient.post<WebhookDelivery>(
        `/api/v1/integrations/webhooks/${endpointId}/test`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      queryClient.invalidateQueries({ queryKey: ["webhookDeliveries"] });
    },
  });
}

export function useRetryDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deliveryId: string) =>
      apiClient.post<WebhookDelivery>(
        `/api/v1/integrations/webhooks/deliveries/${deliveryId}/retry`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhookDeliveries"] });
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
    },
  });
}

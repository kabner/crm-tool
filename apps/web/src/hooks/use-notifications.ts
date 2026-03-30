import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface Notification {
  id: string;
  tenantId: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  actionUrl: string | null;
  resourceType: string | null;
  resourceId: string | null;
  actorId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  data: Notification[];
  unreadCount: number;
}

export interface UnreadCountResponse {
  count: number;
}

export interface NotificationFilters {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}

function buildQueryString(filters: NotificationFilters): string {
  const params = new URLSearchParams();
  if (filters.unreadOnly) {
    params.set("unreadOnly", "true");
  }
  if (filters.limit !== undefined) {
    params.set("limit", String(filters.limit));
  }
  if (filters.offset !== undefined) {
    params.set("offset", String(filters.offset));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useNotifications(options?: NotificationFilters) {
  return useQuery<NotificationsResponse>({
    queryKey: ["notifications", options],
    queryFn: () =>
      apiClient.get<NotificationsResponse>(
        `/api/v1/notifications${buildQueryString(options ?? {})}`,
      ),
  });
}

export function useUnreadCount() {
  return useQuery<UnreadCountResponse>({
    queryKey: ["notifications", "unread-count"],
    queryFn: () =>
      apiClient.get<UnreadCountResponse>("/api/v1/notifications/unread-count"),
    refetchInterval: 30000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      apiClient.patch(`/api/v1/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post("/api/v1/notifications/mark-all-read"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

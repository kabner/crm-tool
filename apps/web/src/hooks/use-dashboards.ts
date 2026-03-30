import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface DashboardWidget {
  id: string;
  dashboardId: string;
  title: string;
  type: "kpi" | "line" | "bar" | "pie" | "funnel" | "table";
  reportId: string | null;
  config: Record<string, any>;
  position: { x: number; y: number; w: number; h: number };
  refreshInterval: number | null;
}

export interface Dashboard {
  id: string;
  name: string;
  description: string | null;
  layout: any[];
  defaultDateRange: string | null;
  isSystem: boolean;
  sharedWith: string[];
  widgetCount?: number;
  widgets?: DashboardWidget[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDashboardInput {
  name: string;
  description?: string;
  isSystem?: boolean;
  defaultDateRange?: string;
}

export interface UpdateDashboardInput extends Partial<CreateDashboardInput> {
  layout?: object[];
  sharedWith?: string[];
}

export interface CreateWidgetInput {
  title: string;
  type: "kpi" | "line" | "bar" | "pie" | "funnel" | "table";
  reportId?: string;
  config: Record<string, any>;
  position: { x: number; y: number; w: number; h: number };
}

export function useDashboards() {
  return useQuery<Dashboard[]>({
    queryKey: ["dashboards"],
    queryFn: () => apiClient.get<Dashboard[]>("/api/v1/data/dashboards"),
  });
}

export function useDashboard(id: string) {
  return useQuery<Dashboard>({
    queryKey: ["dashboards", id],
    queryFn: () => apiClient.get<Dashboard>(`/api/v1/data/dashboards/${id}`),
    enabled: !!id,
  });
}

export function useCreateDashboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDashboardInput) =>
      apiClient.post<Dashboard>("/api/v1/data/dashboards", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboards"] });
    },
  });
}

export function useUpdateDashboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDashboardInput }) =>
      apiClient.patch<Dashboard>(`/api/v1/data/dashboards/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dashboards"] });
      queryClient.invalidateQueries({ queryKey: ["dashboards", variables.id] });
    },
  });
}

export function useAddWidget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      dashboardId,
      data,
    }: {
      dashboardId: string;
      data: CreateWidgetInput;
    }) =>
      apiClient.post<DashboardWidget>(
        `/api/v1/data/dashboards/${dashboardId}/widgets`,
        data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboards"] });
    },
  });
}

export function useRemoveWidget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      dashboardId,
      widgetId,
    }: {
      dashboardId: string;
      widgetId: string;
    }) =>
      apiClient.delete(
        `/api/v1/data/dashboards/${dashboardId}/widgets/${widgetId}`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboards"] });
    },
  });
}

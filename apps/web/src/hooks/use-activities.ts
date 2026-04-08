import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface Activity {
  id: string;
  tenantId: string;
  type: "note" | "task" | "call" | "email" | "meeting";
  subject: string;
  body: string | null;
  contactId: string | null;
  companyId: string | null;
  dealId: string | null;
  userId: string;
  parentId: string | null;
  dueDate: string | null;
  completedAt: string | null;
  recurrenceRule: string | null;
  recurrenceEndDate: string | null;
  recurringSourceId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  children?: Activity[];
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface ActivityListResponse {
  data: Activity[];
  total: number;
  page: number;
  limit: number;
}

export interface ActivitiesResponse {
  data: Activity[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ActivityFilters {
  type?: string;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  userId?: string;
  completed?: boolean;
  dueBefore?: string;
  dueAfter?: string;
  page?: number;
  limit?: number;
}

export interface CreateActivityInput {
  type: string;
  subject: string;
  body?: string;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  parentId?: string;
  dueDate?: string;
  recurrenceRule?: string;
  recurrenceEndDate?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateActivityInput extends Partial<CreateActivityInput> {
  completedAt?: string;
}

function buildQueryString(filters: Record<string, string | number | boolean | undefined | null>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useActivities(filters: ActivityFilters = {}) {
  return useQuery<ActivityListResponse>({
    queryKey: ["activities", filters],
    queryFn: () =>
      apiClient.get<ActivityListResponse>(
        `/api/v1/activities${buildQueryString(filters as Record<string, string | number | boolean | undefined | null>)}`,
      ),
  });
}

export function useContactActivities(contactId: string) {
  return useQuery<ActivityListResponse>({
    queryKey: ["activities", "contact", contactId],
    queryFn: () =>
      apiClient.get<ActivityListResponse>(
        `/api/v1/activities/contact/${contactId}`,
      ),
    enabled: !!contactId,
  });
}

export function useUpcomingTasks() {
  return useQuery<Activity[]>({
    queryKey: ["activities", "upcoming-tasks"],
    queryFn: () =>
      apiClient.get<Activity[]>("/api/v1/activities/tasks/upcoming"),
  });
}

export function useSubtasks(parentId: string) {
  return useQuery<Activity[]>({
    queryKey: ["activities", "subtasks", parentId],
    queryFn: () =>
      apiClient.get<Activity[]>(`/api/v1/activities/${parentId}/subtasks`),
    enabled: !!parentId,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation<Activity, Error, CreateActivityInput>({
    mutationFn: (input) =>
      apiClient.post<Activity>("/api/v1/activities", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation<
    Activity,
    Error,
    { id: string; data: UpdateActivityInput }
  >({
    mutationFn: ({ id, data }) =>
      apiClient.patch<Activity>(`/api/v1/activities/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation<Activity, Error, string>({
    mutationFn: (id) =>
      apiClient.patch<Activity>(`/api/v1/activities/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useDealActivities(dealId: string, page = 1) {
  return useQuery<ActivitiesResponse>({
    queryKey: ["activities", "deal", dealId, page],
    queryFn: () =>
      apiClient.get<ActivitiesResponse>(
        `/api/v1/activities?dealId=${dealId}&page=${page}&limit=20&sort=createdAt&order=DESC`,
      ),
    enabled: !!dealId,
  });
}

export function useCompleteActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.patch(`/api/v1/activities/${id}/complete`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => apiClient.delete<void>(`/api/v1/activities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

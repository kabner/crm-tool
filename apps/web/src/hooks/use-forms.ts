import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface FormField {
  name: string;
  label: string;
  type:
    | "text"
    | "email"
    | "phone"
    | "textarea"
    | "dropdown"
    | "checkbox"
    | "radio"
    | "date"
    | "hidden";
  required: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: string;
}

export interface FormItem {
  id: string;
  tenantId: string;
  name: string;
  status: "draft" | "published" | "archived";
  fields: FormField[];
  settings: Record<string, any>;
  embedCode: string | null;
  submissionCount: number;
  campaignId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FormSubmission {
  id: string;
  tenantId: string;
  formId: string;
  contactId: string | null;
  data: Record<string, any>;
  pageUrl: string | null;
  referrer: string | null;
  utmParams: Record<string, any> | null;
  ipAddress: string | null;
  submittedAt: string;
  consentGiven: boolean;
}

export interface FormsResponse {
  data: FormItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SubmissionsResponse {
  data: FormSubmission[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface FormFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface CreateFormInput {
  name: string;
  fields: FormField[];
  settings?: Record<string, any>;
}

export interface UpdateFormInput {
  name?: string;
  fields?: FormField[];
  settings?: Record<string, any>;
}

function buildQueryString(filters: Record<string, any>): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useForms(filters: FormFilters = {}) {
  return useQuery<FormsResponse>({
    queryKey: ["forms", filters],
    queryFn: () =>
      apiClient.get<FormsResponse>(
        `/api/v1/marketing/forms${buildQueryString(filters)}`,
      ),
  });
}

export function useForm(id: string) {
  return useQuery<FormItem>({
    queryKey: ["forms", id],
    queryFn: () =>
      apiClient.get<FormItem>(`/api/v1/marketing/forms/${id}`),
    enabled: !!id,
  });
}

export function useCreateForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFormInput) =>
      apiClient.post<FormItem>("/api/v1/marketing/forms", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
  });
}

export function useUpdateForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFormInput }) =>
      apiClient.patch<FormItem>(`/api/v1/marketing/forms/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      queryClient.invalidateQueries({ queryKey: ["forms", variables.id] });
    },
  });
}

export function usePublishForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<FormItem>(`/api/v1/marketing/forms/${id}/publish`),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      queryClient.invalidateQueries({ queryKey: ["forms", id] });
    },
  });
}

export function useDeleteForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/v1/marketing/forms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
  });
}

export function useFormSubmissions(
  formId: string,
  pagination: { page?: number; limit?: number } = {},
) {
  return useQuery<SubmissionsResponse>({
    queryKey: ["forms", formId, "submissions", pagination],
    queryFn: () =>
      apiClient.get<SubmissionsResponse>(
        `/api/v1/marketing/forms/${formId}/submissions${buildQueryString(pagination)}`,
      ),
    enabled: !!formId,
  });
}

export function useFormEmbedCode(formId: string) {
  return useQuery<{ embedCode: string }>({
    queryKey: ["forms", formId, "embed"],
    queryFn: () =>
      apiClient.get<{ embedCode: string }>(
        `/api/v1/marketing/forms/${formId}/embed`,
      ),
    enabled: !!formId,
  });
}

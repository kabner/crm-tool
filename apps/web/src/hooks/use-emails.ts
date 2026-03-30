import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// --- Interfaces ---

export interface EmailSection {
  id: string;
  type: "header" | "text" | "button" | "image" | "divider";
  content: string;
  url?: string;
  alt?: string;
}

export interface MarketingEmail {
  id: string;
  tenantId: string;
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  status: "draft" | "scheduled" | "sending" | "sent";
  sendType: "immediate" | "scheduled";
  contentJson: EmailSection[];
  contentHtml: string;
  scheduledAt: string | null;
  sentAt: string | null;
  templateId: string | null;
  campaignId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailStats {
  emailId: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
}

export interface EmailTemplate {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  contentJson: EmailSection[];
  contentHtml: string;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailsResponse {
  data: MarketingEmail[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TemplatesResponse {
  data: EmailTemplate[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface EmailFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface CreateEmailInput {
  name: string;
  subject?: string;
  fromName?: string;
  fromEmail?: string;
  contentJson?: EmailSection[];
  contentHtml?: string;
  templateId?: string;
  campaignId?: string;
}

export interface UpdateEmailInput {
  name?: string;
  subject?: string;
  fromName?: string;
  fromEmail?: string;
  contentJson?: EmailSection[];
  contentHtml?: string;
  status?: string;
  scheduledAt?: string;
}

export interface SendEmailInput {
  listIds?: string[];
  contactIds?: string[];
  scheduledAt?: string;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  contentJson: EmailSection[];
  contentHtml: string;
}

// --- Helpers ---

function buildQueryString(filters: Record<string, unknown>): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

// --- Hooks ---

export function useEmails(filters: EmailFilters = {}) {
  return useQuery<EmailsResponse>({
    queryKey: ["emails", filters],
    queryFn: () =>
      apiClient.get<EmailsResponse>(
        `/api/v1/marketing/emails${buildQueryString(filters as Record<string, unknown>)}`,
      ),
  });
}

export function useEmail(id: string) {
  return useQuery<MarketingEmail>({
    queryKey: ["emails", id],
    queryFn: () =>
      apiClient.get<MarketingEmail>(`/api/v1/marketing/emails/${id}`),
    enabled: !!id,
  });
}

export function useCreateEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEmailInput) =>
      apiClient.post<MarketingEmail>("/api/v1/marketing/emails", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
    },
  });
}

export function useUpdateEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmailInput }) =>
      apiClient.patch<MarketingEmail>(
        `/api/v1/marketing/emails/${id}`,
        data,
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["emails", variables.id] });
    },
  });
}

export function useDeleteEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/v1/marketing/emails/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
    },
  });
}

export function useDuplicateEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<MarketingEmail>(
        `/api/v1/marketing/emails/${id}/duplicate`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
    },
  });
}

export function useSendEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SendEmailInput }) =>
      apiClient.post<MarketingEmail>(
        `/api/v1/marketing/emails/${id}/send`,
        data,
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["emails", variables.id] });
    },
  });
}

export function useEmailStats(id: string) {
  return useQuery<EmailStats>({
    queryKey: ["emails", id, "stats"],
    queryFn: () =>
      apiClient.get<EmailStats>(`/api/v1/marketing/emails/${id}/stats`),
    enabled: !!id,
  });
}

export function useTemplates() {
  return useQuery<TemplatesResponse>({
    queryKey: ["email-templates"],
    queryFn: () =>
      apiClient.get<TemplatesResponse>("/api/v1/marketing/templates"),
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTemplateInput) =>
      apiClient.post<EmailTemplate>("/api/v1/marketing/templates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
    },
  });
}

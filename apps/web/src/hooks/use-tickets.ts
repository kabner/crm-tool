import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface TicketMessage {
  id: string;
  ticketId: string;
  type: string;
  direction: string;
  fromContact: boolean;
  userId: string | null;
  bodyHtml: string;
  bodyText: string | null;
  attachments: any[];
  createdAt: string;
}

export interface Ticket {
  id: string;
  tenantId: string;
  number: string;
  subject: string;
  status: string;
  priority: string;
  categoryId: string | null;
  contactId: string;
  companyId: string | null;
  assignedTo: string | null;
  assignedTeam: string | null;
  channel: string;
  tags: string[];
  firstResponseAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  slaFirstResponseDue: string | null;
  slaResolutionDue: string | null;
  slaBreached: boolean;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string } | null;
  messages?: TicketMessage[];
}

export interface TicketsResponse {
  data: Ticket[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TicketFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  categoryId?: string;
  contactId?: string;
  sort?: string;
  order?: "ASC" | "DESC";
}

export interface CreateTicketInput {
  subject: string;
  contactId: string;
  priority?: string;
  categoryId?: string;
  channel?: string;
  assignedTo?: string;
  tags?: string[];
  initialMessage?: string;
}

export interface UpdateTicketInput {
  subject?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  assignedTeam?: string;
  categoryId?: string;
  tags?: string[];
}

export interface CreateMessageInput {
  bodyHtml: string;
  type?: "reply" | "note";
  direction?: "outbound" | "internal";
}

export interface TicketStats {
  open: number;
  pending: number;
  resolved: number;
  avgResponseTime: number | null;
  avgResolutionTime: number | null;
}

function buildQueryString(filters: TicketFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useTickets(filters: TicketFilters = {}) {
  return useQuery<TicketsResponse>({
    queryKey: ["tickets", filters],
    queryFn: () =>
      apiClient.get<TicketsResponse>(
        `/api/v1/tickets${buildQueryString(filters)}`,
      ),
  });
}

export function useTicket(id: string) {
  return useQuery<Ticket>({
    queryKey: ["tickets", id],
    queryFn: () => apiClient.get<Ticket>(`/api/v1/tickets/${id}`),
    enabled: !!id,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTicketInput) =>
      apiClient.post<Ticket>("/api/v1/tickets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTicketInput }) =>
      apiClient.patch<Ticket>(`/api/v1/tickets/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({
        queryKey: ["tickets", variables.id],
      });
    },
  });
}

export function useAddTicketMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      data,
    }: {
      ticketId: string;
      data: CreateMessageInput;
    }) => apiClient.post<TicketMessage>(`/api/v1/tickets/${ticketId}/messages`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tickets", variables.ticketId],
      });
    },
  });
}

export function useAssignTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      userId,
    }: {
      ticketId: string;
      userId: string;
    }) => apiClient.post<Ticket>(`/api/v1/tickets/${ticketId}/assign`, { userId }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({
        queryKey: ["tickets", variables.ticketId],
      });
    },
  });
}

export function useCloseTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: string) =>
      apiClient.post<Ticket>(`/api/v1/tickets/${ticketId}/close`),
    onSuccess: (_data, ticketId) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({
        queryKey: ["tickets", ticketId],
      });
    },
  });
}

export function useTicketStats() {
  return useQuery<TicketStats>({
    queryKey: ["tickets", "stats"],
    queryFn: () => apiClient.get<TicketStats>("/api/v1/tickets/stats"),
  });
}

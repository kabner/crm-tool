import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPct: number | null;
  taxRateId: string | null;
  total: number;
  position: number;
}

export interface Invoice {
  id: string;
  tenantId: string;
  number: string;
  contactId: string;
  companyId: string | null;
  dealId: string | null;
  status: string;
  issueDate: string;
  dueDate: string;
  paymentTerms: string | null;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  notes: string | null;
  footer: string | null;
  sentAt: string | null;
  paidAt: string | null;
  lineItems?: InvoiceLineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoicesResponse {
  data: Invoice[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface InvoiceFilters {
  page?: number;
  limit?: number;
  status?: string;
  contactId?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateInvoiceInput {
  contactId: string;
  companyId?: string;
  dealId?: string;
  dueDate: string;
  paymentTerms?: string;
  notes?: string;
  footer?: string;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    productId?: string;
    discountPct?: number;
    taxRateId?: string;
  }[];
}

function buildQueryString(filters: InvoiceFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useInvoices(filters: InvoiceFilters = {}) {
  return useQuery<InvoicesResponse>({
    queryKey: ["invoices", filters],
    queryFn: () =>
      apiClient.get<InvoicesResponse>(
        `/api/v1/commerce/invoices${buildQueryString(filters)}`,
      ),
  });
}

export function useInvoice(id: string) {
  return useQuery<Invoice>({
    queryKey: ["invoices", id],
    queryFn: () => apiClient.get<Invoice>(`/api/v1/commerce/invoices/${id}`),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInvoiceInput) =>
      apiClient.post<Invoice>("/api/v1/commerce/invoices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useSendInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<Invoice>(`/api/v1/commerce/invoices/${id}/send`),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices", id] });
    },
  });
}

export function useMarkPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<Invoice>(`/api/v1/commerce/invoices/${id}/mark-paid`),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices", id] });
    },
  });
}

export function useVoidInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<Invoice>(`/api/v1/commerce/invoices/${id}/void`),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices", id] });
    },
  });
}

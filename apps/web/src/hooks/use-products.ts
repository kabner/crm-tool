import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface Price {
  id: string;
  productId: string;
  name: string;
  type: string;
  amount: number;
  currency: string;
  interval: string | null;
  intervalCount: number;
  trialDays: number;
  status: string;
  createdAt: string;
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  sku: string | null;
  categoryId: string | null;
  status: string;
  prices: Price[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  sku?: string;
  categoryId?: string;
  prices?: {
    name: string;
    type: string;
    amount: number;
    currency?: string;
    interval?: string;
    intervalCount?: number;
    trialDays?: number;
  }[];
}

export interface UpdateProductInput extends Partial<CreateProductInput> {}

function buildQueryString(filters: ProductFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery<ProductsResponse>({
    queryKey: ["products", filters],
    queryFn: () =>
      apiClient.get<ProductsResponse>(
        `/api/v1/commerce/products${buildQueryString(filters)}`,
      ),
  });
}

export function useProduct(id: string) {
  return useQuery<Product>({
    queryKey: ["products", id],
    queryFn: () => apiClient.get<Product>(`/api/v1/commerce/products/${id}`),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductInput) =>
      apiClient.post<Product>("/api/v1/commerce/products", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductInput }) =>
      apiClient.patch<Product>(`/api/v1/commerce/products/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products", variables.id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/v1/commerce/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

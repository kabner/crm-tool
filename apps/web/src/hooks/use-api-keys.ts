import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface APIKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: Record<string, "read" | "read_write">;
  rateLimit: number;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

export interface CreateApiKeyInput {
  name: string;
  scopes: Record<string, "read" | "read_write">;
  rateLimit?: number;
  expiresAt?: string;
}

export interface CreateApiKeyResponse {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: Record<string, "read" | "read_write">;
  rateLimit: number;
  expiresAt: string | null;
  createdAt: string;
  plainKey: string;
}

export function useApiKeys() {
  return useQuery<APIKey[]>({
    queryKey: ["apiKeys"],
    queryFn: () => apiClient.get<APIKey[]>("/api/v1/integrations/api-keys"),
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateApiKeyInput) =>
      apiClient.post<CreateApiKeyResponse>(
        "/api/v1/integrations/api-keys",
        data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
    },
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/v1/integrations/api-keys/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
    },
  });
}

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface TenantUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export function useUsers() {
  return useQuery<TenantUser[]>({
    queryKey: ["users"],
    queryFn: () => apiClient.get<TenantUser[]>("/api/v1/auth/users"),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

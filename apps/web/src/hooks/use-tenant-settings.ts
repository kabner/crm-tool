import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useTenantSettings<T = Record<string, unknown>>(key: string) {
  return useQuery<T>({
    queryKey: ['tenant-settings', key],
    queryFn: () => apiClient.get<T>(`/api/v1/tenant-settings/${key}`),
  });
}

export function useUpdateTenantSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: Record<string, unknown> }) =>
      apiClient.put(`/api/v1/tenant-settings/${key}`, { value }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['tenant-settings', variables.key],
      });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useUserSettings<T = Record<string, unknown>>(section: string) {
  return useQuery<T>({
    queryKey: ['user-settings', section],
    queryFn: () => apiClient.get<T>(`/api/v1/user-settings/${section}`),
  });
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ section, data }: { section: string; data: Record<string, unknown> }) =>
      apiClient.put(`/api/v1/user-settings/${section}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['user-settings', variables.section],
      });
    },
  });
}

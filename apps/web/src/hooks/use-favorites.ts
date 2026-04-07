import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Favorite {
  id: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

export function useFavorites(entityType: string) {
  return useQuery<Favorite[]>({
    queryKey: ['favorites', entityType],
    queryFn: () =>
      apiClient.get<Favorite[]>(`/api/v1/favorites?entityType=${entityType}`),
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { entityType: string; entityId: string }) =>
      apiClient.post('/api/v1/favorites/toggle', data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['favorites', variables.entityType],
      });
    },
  });
}

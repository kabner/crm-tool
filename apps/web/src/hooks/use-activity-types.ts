'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface ActivityTypeOption {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  isInteraction: boolean;
  isSystem: boolean;
  position: number;
}

export function useActivityTypes() {
  return useQuery<ActivityTypeOption[]>({
    queryKey: ['activity-types'],
    queryFn: () => apiClient.get('/api/v1/activity-types'),
  });
}

export function useCreateActivityType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; slug: string; icon?: string; color?: string; isInteraction?: boolean }) =>
      apiClient.post('/api/v1/activity-types', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activity-types'] }),
  });
}

export function useUpdateActivityType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; icon?: string; color?: string; isInteraction?: boolean; position?: number }) =>
      apiClient.patch(`/api/v1/activity-types/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activity-types'] }),
  });
}

export function useDeleteActivityType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/activity-types/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activity-types'] }),
  });
}

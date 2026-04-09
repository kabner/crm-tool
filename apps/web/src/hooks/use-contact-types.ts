'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface ContactTypeOption {
  id: string;
  tenantId: string;
  name: string;
  color: string;
  position: number;
}

export function useContactTypes() {
  return useQuery<ContactTypeOption[]>({
    queryKey: ['contact-types'],
    queryFn: () => apiClient.get('/api/v1/contact-types'),
  });
}

export function useCreateContactType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; color?: string }) =>
      apiClient.post('/api/v1/contact-types', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contact-types'] }),
  });
}

export function useUpdateContactType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; color?: string; position?: number }) =>
      apiClient.patch(`/api/v1/contact-types/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contact-types'] }),
  });
}

export function useDeleteContactType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/contact-types/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contact-types'] }),
  });
}

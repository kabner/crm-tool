'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useContactDuplicates() {
  return useQuery({
    queryKey: ['contact-duplicates'],
    queryFn: () => apiClient.get('/api/v1/contacts/duplicates'),
    enabled: false,
  });
}

export function useMergeContacts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { keepId: string; mergeId: string }) =>
      apiClient.post('/api/v1/contacts/merge', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['contact-duplicates'] });
    },
  });
}

export function useCompanyDuplicates() {
  return useQuery({
    queryKey: ['company-duplicates'],
    queryFn: () => apiClient.get('/api/v1/companies/duplicates'),
    enabled: false,
  });
}

export function useMergeCompanies() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { keepId: string; mergeId: string }) =>
      apiClient.post('/api/v1/companies/merge', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      qc.invalidateQueries({ queryKey: ['company-duplicates'] });
    },
  });
}

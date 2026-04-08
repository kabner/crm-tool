'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Attachment {
  id: string;
  entityType: string;
  entityId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  uploadedById: string;
  uploadedBy: { firstName: string; lastName: string } | null;
  createdAt: string;
}

export function useAttachments(entityType: string, entityId: string) {
  return useQuery<Attachment[]>({
    queryKey: ['attachments', entityType, entityId],
    queryFn: () =>
      apiClient.get(
        `/api/v1/attachments?entityType=${entityType}&entityId=${entityId}`,
      ),
    enabled: !!entityId,
  });
}

export function useUploadAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      entityType: string;
      entityId: string;
      file: File;
    }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('entityType', data.entityType);
      formData.append('entityId', data.entityId);
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('auth_token')
          : null;
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/v1/attachments/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({
        queryKey: ['attachments', vars.entityType, vars.entityId],
      });
    },
  });
}

export function useDeleteAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/attachments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attachments'] });
    },
  });
}

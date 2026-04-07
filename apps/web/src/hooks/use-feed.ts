import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface FeedItem {
  id: string;
  feedType: 'activity' | 'notification';
  type: string;
  title: string;
  body: string | null;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string } | null;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  dueDate?: string;
  completedAt?: string;
  actionUrl?: string;
  readAt?: string;
  reactions: { emoji: string; count: number; reacted: boolean }[];
}

export interface FeedResponse {
  data: FeedItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function useFeed(mode: 'all' | 'mine', page: number = 1) {
  return useQuery<FeedResponse>({
    queryKey: ['feed', mode, page],
    queryFn: () => apiClient.get(`/api/v1/feed?mode=${mode}&page=${page}&limit=30`),
    refetchInterval: 30000,
  });
}

export function useToggleReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { entityType: string; entityId: string; emoji: string }) =>
      apiClient.post('/api/v1/feed/reactions', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

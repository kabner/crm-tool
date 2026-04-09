'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface GoogleStatus {
  connected: boolean;
  email?: string;
  scopes?: string[];
  gmailLastSyncAt?: string;
  calendarLastSyncAt?: string;
}

export interface GoogleAuthUrl {
  url: string;
}

export interface SyncResult {
  synced: number;
  matched: number;
}

export interface GmailSendInput {
  to: string;
  subject: string;
  body: string;
  contactId?: string;
}

export interface CalendarEventInput {
  summary: string;
  description?: string;
  start: string;
  end: string;
  attendees?: string[];
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  attendees?: string[];
  [key: string]: unknown;
}

// ── Hooks ───────────────────────────────────────────────────────────────────

export function useGoogleStatus() {
  return useQuery<GoogleStatus>({
    queryKey: ['google-status'],
    queryFn: () => apiClient.get('/api/v1/integrations/google/status'),
    refetchInterval: false,
  });
}

export function useGoogleConnect() {
  return useMutation({
    mutationFn: async () => {
      const { url } = await apiClient.get<GoogleAuthUrl>(
        '/api/v1/integrations/google/auth-url',
      );
      window.location.href = url;
    },
  });
}

export function useGoogleDisconnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.delete('/api/v1/integrations/google/disconnect'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['google-status'] }),
  });
}

export function useGmailSync() {
  const qc = useQueryClient();
  return useMutation<SyncResult>({
    mutationFn: () =>
      apiClient.post('/api/v1/integrations/google/gmail/sync'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['google-status'] }),
  });
}

export function useCalendarSync() {
  const qc = useQueryClient();
  return useMutation<SyncResult>({
    mutationFn: () =>
      apiClient.post('/api/v1/integrations/google/calendar/sync'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['google-status'] }),
  });
}

export function useGmailSend() {
  return useMutation({
    mutationFn: (data: GmailSendInput) =>
      apiClient.post('/api/v1/integrations/google/gmail/send', data),
  });
}

export function useUpcomingEvents(days?: number, enabled?: boolean) {
  const params = days ? `?days=${days}` : '';
  return useQuery<CalendarEvent[]>({
    queryKey: ['google-calendar-upcoming', days],
    queryFn: () =>
      apiClient.get(`/api/v1/integrations/google/calendar/upcoming${params}`),
    enabled: enabled === true,
  });
}

export function useGmailThread(threadId: string | null) {
  return useQuery({
    queryKey: ['gmail-thread', threadId],
    queryFn: () =>
      apiClient.get(`/api/v1/integrations/google/gmail/thread/${threadId}`),
    enabled: !!threadId,
  });
}

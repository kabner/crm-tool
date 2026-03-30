import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface ChatSession {
  id: string;
  tenantId: string;
  contactId: string | null;
  agentId: string | null;
  status: string;
  channel: string;
  startedAt: string;
  firstResponseAt: string | null;
  endedAt: string | null;
  ticketId: string | null;
  satisfaction: string | null;
  metadata: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderType: string;
  senderId: string | null;
  body: string;
  attachments: any[];
  createdAt: string;
}

export function useChatSessions(agentId?: string) {
  const params = agentId ? `?agentId=${agentId}` : "";
  return useQuery<ChatSession[]>({
    queryKey: ["chat-sessions", agentId],
    queryFn: () =>
      apiClient.get<ChatSession[]>(`/api/v1/service/chat/sessions${params}`),
    refetchInterval: 5000,
  });
}

export function useChatMessages(sessionId: string | null) {
  return useQuery<ChatMessage[]>({
    queryKey: ["chat-messages", sessionId],
    queryFn: () =>
      apiClient.get<ChatMessage[]>(
        `/api/v1/service/chat/sessions/${sessionId}/messages`,
      ),
    enabled: !!sessionId,
    refetchInterval: 3000,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      body,
      senderType,
    }: {
      sessionId: string;
      body: string;
      senderType?: "contact" | "agent";
    }) =>
      apiClient.post<ChatMessage>(
        `/api/v1/service/chat/sessions/${sessionId}/messages`,
        { sessionId, body, senderType },
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["chat-messages", variables.sessionId],
      });
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
    },
  });
}

export function useAssignChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      apiClient.post<ChatSession>(
        `/api/v1/service/chat/sessions/${sessionId}/assign`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
    },
  });
}

export function useEndChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      apiClient.post<ChatSession>(
        `/api/v1/service/chat/sessions/${sessionId}/end`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
    },
  });
}

export function useConvertToTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      subject,
    }: {
      sessionId: string;
      subject?: string;
    }) =>
      apiClient.post<ChatSession>(
        `/api/v1/service/chat/sessions/${sessionId}/convert-to-ticket`,
        { subject },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
    },
  });
}

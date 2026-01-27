import { apiClient } from '../../lib/apiClient';

export type ChatRequest = {
  message: string;
  client_ts: number;
  context?: { lang?: string };
};

export type ChatResponse = {
  ok: boolean;
  reply: string;
  chat_id: string;
  provider: 'gemini' | 'mock';
  created_at: string;
};

export const chatApi = {
  async sendMessage(payload: Omit<ChatRequest, 'client_ts'>) {
    const response = await apiClient<ChatResponse>('/api/mobile/chat', {
      method: 'POST',
      body: { ...payload, client_ts: Date.now() }
    });
    return { response, reply: response.reply };
  }
};

import { apiClient } from './axios';
import { Message } from '../types/chat';

export const messagesApi = {
  getMessages: async (roomId: number): Promise<Message[]> => {
    const response = await apiClient.get<Message[]>(`/rooms/${roomId}/messages`);
    return response.data;
  },
};


import { apiClient } from './axios';
import { PresenceUser } from '../types/chat';

export const presenceApi = {
  getPresence: async (roomId: number): Promise<PresenceUser[]> => {
    const response = await apiClient.get<PresenceUser[]>(`/presence/${roomId}`);
    return response.data;
  },
};


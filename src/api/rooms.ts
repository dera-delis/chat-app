import { apiClient } from './axios';
import { Room, RoomJoinRequest } from '../types/chat';

export interface CreateRoomData {
  name: string;
  description?: string;
  is_private?: boolean;
}

export interface InviteMemberData {
  username?: string;
  email?: string;
}

export interface InviteLinkResponse {
  token: string;
  room_id: number;
  expires_at?: string | null;
}

export const roomsApi = {
  getRooms: async (): Promise<Room[]> => {
    const response = await apiClient.get<Room[]>('/rooms');
    return response.data;
  },

  getPublicRooms: async (): Promise<Room[]> => {
    const response = await apiClient.get<Room[]>('/rooms/public');
    return response.data;
  },

  getRoom: async (roomId: number): Promise<Room> => {
    const response = await apiClient.get<Room>(`/rooms/${roomId}`);
    return response.data;
  },

  createRoom: async (data: CreateRoomData): Promise<Room> => {
    const response = await apiClient.post<Room>('/rooms', data);
    return response.data;
  },

  joinRoom: async (roomId: number): Promise<void> => {
    await apiClient.post(`/rooms/${roomId}/join`);
  },

  leaveRoom: async (roomId: number): Promise<void> => {
    await apiClient.post(`/rooms/${roomId}/leave`);
  },

  deleteRoom: async (roomId: number): Promise<void> => {
    await apiClient.delete(`/rooms/${roomId}`);
  },

  inviteMember: async (roomId: number, data: InviteMemberData): Promise<void> => {
    await apiClient.post(`/rooms/${roomId}/members`, data);
  },

  createInviteLink: async (roomId: number): Promise<InviteLinkResponse> => {
    const response = await apiClient.post<InviteLinkResponse>(`/rooms/${roomId}/invites`);
    return response.data;
  },

  requestJoinByInvite: async (token: string): Promise<RoomJoinRequest> => {
    const response = await apiClient.post<RoomJoinRequest>(`/rooms/invites/${token}/request`);
    return response.data;
  },

  getJoinRequests: async (roomId: number): Promise<RoomJoinRequest[]> => {
    const response = await apiClient.get<RoomJoinRequest[]>(`/rooms/${roomId}/requests`);
    return response.data;
  },

  approveJoinRequest: async (roomId: number, requestId: number): Promise<void> => {
    await apiClient.post(`/rooms/${roomId}/requests/${requestId}/approve`);
  },

  rejectJoinRequest: async (roomId: number, requestId: number): Promise<void> => {
    await apiClient.post(`/rooms/${roomId}/requests/${requestId}/reject`);
  },
};


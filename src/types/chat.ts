export interface Room {
  id: number;
  name: string;
  description?: string;
  is_private: boolean;
  created_at: string;
  created_by: number;
}

export interface RoomJoinRequest {
  id: number;
  room_id: number;
  user_id: number;
  status: string;
  created_at: string;
  username?: string;
}

export interface Message {
  id: number;
  room_id: number;
  user_id: number;
  username: string;
  content: string;
  timestamp: string;
  edited?: boolean;
}

export interface PresenceUser {
  user_id: number;
  username: string;
}

export interface WebSocketMessage {
  type: 'message' | 'system' | 'connected' | 'edit' | 'typing';
  id?: number;
  room_id?: number;
  user_id?: number;
  username?: string;
  content?: string;
  timestamp?: string;
  message?: string;
  edited?: boolean;
  message_id?: number;
  is_typing?: boolean;
}


import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { Message, Room, WebSocketMessage } from '../types/chat';
import { ChatWebSocket } from '../websocket/ChatWebSocket';
import { roomsApi } from '../api/rooms';
import { useAuth } from './AuthContext';

interface ChatContextType {
  currentRoom: Room | null;
  messages: Message[];
  rooms: Room[];
  ws: ChatWebSocket | null;
  setCurrentRoom: (room: Room | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setRooms: (rooms: Room[]) => void;
  isConnected: boolean;
  typingUsers: { user_id: number; username: string }[];
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [ws, setWs] = useState<ChatWebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ user_id: number; username: string }[]>([]);
  const typingTimeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const wsRef = useRef<ChatWebSocket | null>(null);
  const currentRoomIdRef = useRef<number | null>(null);
  const isConnectingRef = useRef<boolean>(false);
  const cleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectionConfirmedRef = useRef<boolean>(false);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      if (message.id && prev.some((m) => m.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });
  }, []);

  useEffect(() => {
    if (!token) {
      setRooms([]);
      setTypingUsers([]);
      return;
    }
    roomsApi.getRooms()
      .then(setRooms)
      .catch(() => {
        // Best-effort: sidebar should not break if this fails
      });
  }, [token]);

  // Only depend on room ID and token, not the entire room object or addMessage
  const roomId = currentRoom?.id && typeof currentRoom.id === 'number' && currentRoom.id > 0 
    ? currentRoom.id 
    : null;

  useEffect(() => {
    // Early return if no valid room or token
    if (!roomId || !token) {
      // Only disconnect if we had a confirmed connection to a different room
      // Don't disconnect if we're just in the middle of setting up (React Strict Mode)
      if (wsRef.current && currentRoomIdRef.current !== null && connectionConfirmedRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
        currentRoomIdRef.current = null;
        connectionConfirmedRef.current = false;
        setWs(null);
        setIsConnected(false);
      } else if (wsRef.current && !isConnectingRef.current) {
        // Only disconnect if not actively connecting (avoid disconnecting during setup)
        wsRef.current.disconnect();
        wsRef.current = null;
        currentRoomIdRef.current = null;
        connectionConfirmedRef.current = false;
        setWs(null);
        setIsConnected(false);
      }
      return;
    }
    
    // Check if we're already connected and confirmed for this room
    if (roomId === currentRoomIdRef.current && 
        wsRef.current?.isConnected() && 
        connectionConfirmedRef.current) {
      return;
    }
    
    // If we have a valid room and token
    if (roomId && token) {
      // Disconnect any existing connection when (re)connecting to avoid duplicates
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
      
      // Prevent multiple simultaneous connection attempts
      if (isConnectingRef.current) {
        return;
      }
      
      isConnectingRef.current = true;
      connectionConfirmedRef.current = false;
      currentRoomIdRef.current = roomId;
      
      const websocket = new ChatWebSocket();
      wsRef.current = websocket;
      setWs(websocket);

      websocket.on('open', () => {
        // Don't set isConnected yet - wait for "connected" message from backend
        isConnectingRef.current = false;
        connectionConfirmedRef.current = false;
      });

      // Handle connection confirmation from backend
      websocket.on('connected', (_wsMessage: WebSocketMessage) => {
        connectionConfirmedRef.current = true;
        setIsConnected(true);
        isConnectingRef.current = false;
      });

      websocket.on('message', (wsMessage: WebSocketMessage) => {
        // Handle regular chat messages
        if (wsMessage.type === 'message' && wsMessage.id && wsMessage.content) {
          const message: Message = {
            id: wsMessage.id,
            room_id: wsMessage.room_id || roomId,
            user_id: wsMessage.user_id || 0,
            username: wsMessage.username || 'Unknown',
            content: wsMessage.content,
            timestamp: wsMessage.timestamp || new Date().toISOString(),
            edited: wsMessage.edited || false,
          };
          addMessage(message);
        }

        if (wsMessage.type === 'edit' && wsMessage.id && wsMessage.content) {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === wsMessage.id
                ? {
                    ...message,
                    content: wsMessage.content || message.content,
                    timestamp: wsMessage.timestamp || message.timestamp,
                    edited: true,
                  }
                : message
            )
          );
        }

        if (wsMessage.type === 'typing' && wsMessage.user_id && wsMessage.username) {
          setTypingUsers((prev) => {
            const exists = prev.some((u) => u.user_id === wsMessage.user_id);
            if (wsMessage.is_typing) {
              return exists ? prev : [...prev, { user_id: wsMessage.user_id, username: wsMessage.username }];
            }
            return prev.filter((u) => u.user_id !== wsMessage.user_id);
          });

          const existingTimeout = typingTimeoutsRef.current.get(wsMessage.user_id);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }
          if (wsMessage.is_typing) {
            const timeout = setTimeout(() => {
              setTypingUsers((prev) => prev.filter((u) => u.user_id !== wsMessage.user_id));
              typingTimeoutsRef.current.delete(wsMessage.user_id);
            }, 2000);
            typingTimeoutsRef.current.set(wsMessage.user_id, timeout);
          } else {
            typingTimeoutsRef.current.delete(wsMessage.user_id);
          }
        }
        
        // Handle system messages (optional - for user joined/left notifications)
        if (wsMessage.type === 'system') {
          return;
        }
      });

      websocket.on('error', () => {
        setIsConnected(false);
        isConnectingRef.current = false;
      });

      websocket.on('close', () => {
        setIsConnected(false);
        isConnectingRef.current = false;
        connectionConfirmedRef.current = false;
        // Only clear ref if we're not switching to a different room
        if (currentRoomIdRef.current === roomId) {
          currentRoomIdRef.current = null;
        }
        setTypingUsers([]);
        typingTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
        typingTimeoutsRef.current.clear();
      });

      websocket.connect(roomId, token);

      return () => {
        // Clear any pending cleanup timeout
        if (cleanupTimeoutRef.current) {
          clearTimeout(cleanupTimeoutRef.current);
          cleanupTimeoutRef.current = null;
        }
        
        // Store values at the time cleanup is called
        const cleanupRoomId = roomId;
        const wasConfirmed = connectionConfirmedRef.current;
        
        // Only cleanup if:
        // 1. The room actually changed (not just a re-render)
        // 2. OR the connection was never confirmed (failed connection)
        // Don't cleanup if connection is confirmed and room hasn't changed
        if (currentRoomIdRef.current !== cleanupRoomId) {
          // Room changed - disconnect old connection
          if (wsRef.current && currentRoomIdRef.current === cleanupRoomId) {
            wsRef.current.disconnect();
            wsRef.current = null;
            currentRoomIdRef.current = null;
            connectionConfirmedRef.current = false;
            setWs(null);
            setIsConnected(false);
            isConnectingRef.current = false;
          }
        } else if (!wasConfirmed) {
          // Connection was never confirmed - this might be a React Strict Mode re-run
          // Delay cleanup to see if connection gets confirmed
          cleanupTimeoutRef.current = setTimeout(() => {
            // Only cleanup if still not confirmed and still on same room
            if (!connectionConfirmedRef.current && currentRoomIdRef.current === cleanupRoomId) {
              if (wsRef.current) {
                wsRef.current.disconnect();
                wsRef.current = null;
              }
              currentRoomIdRef.current = null;
              connectionConfirmedRef.current = false;
              setWs(null);
              setIsConnected(false);
              isConnectingRef.current = false;
            }
          }, 500); // Give connection time to be confirmed
        }
      };
    }
  }, [roomId, token]); // Only re-run when roomId or token changes

  const value: ChatContextType = {
    currentRoom,
    messages,
    rooms,
    ws,
    setCurrentRoom,
    setMessages,
    addMessage,
    setRooms,
    isConnected,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};


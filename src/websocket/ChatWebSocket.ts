import { WebSocketMessage } from '../types/chat';
import { WS_BASE_URL } from '../utils/env';

export class ChatWebSocket {
  private ws: WebSocket | null = null;
  private roomId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private connectionConfirmed = false;

  connect(roomId: number, token: string): void {
    if (this.ws?.readyState === WebSocket.OPEN && this.roomId === roomId && this.connectionConfirmed) {
      return;
    }

    if (this.ws && (this.roomId !== roomId || !this.connectionConfirmed)) {
      this.disconnect();
    }
    this.roomId = roomId;

    const wsUrl = `${WS_BASE_URL}/ws/chat/${roomId}?token=${token}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.connectionConfirmed = false;
      this.emit('open', {});
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        if (message.type === 'connected') {
          this.connectionConfirmed = true;
          this.reconnectAttempts = 0;
          this.emit('connected', message);
        }
        this.emit('message', message);
      } catch {
        this.emit('error', { error: 'Invalid WebSocket message format' });
      }
    };

    this.ws.onerror = () => {
      this.emit('error', { error: 'WebSocket connection error' });
    };

    this.ws.onclose = (event) => {
      const wasConfirmed = this.connectionConfirmed;
      this.connectionConfirmed = false;
      this.emit('close', {});

      if (!wasConfirmed && event.code !== 1000 && event.code !== 1001) {
        this.attemptReconnect(roomId, token);
      }
    };
  }

  private attemptReconnect(roomId: number, token: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('error', { error: 'Failed to reconnect to chat' });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      this.connect(roomId, token);
    }, delay);
  }

  sendMessage(content: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'message', content }));
    } else {
      this.emit('error', { error: 'Not connected to chat' });
    }
  }

  sendTyping(isTyping: boolean): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'typing', is_typing: isTyping }));
    }
  }

  editMessage(messageId: number, content: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'edit', message_id: messageId, content }));
    } else {
      this.emit('error', { error: 'Not connected to chat' });
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Intentional disconnect');
      this.ws = null;
    }
    this.roomId = null;
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  isConnectionConfirmed(): boolean {
    return this.connectionConfirmed;
  }
}


import { useEffect, useRef } from 'react';
import { ChatWebSocket } from '../websocket/ChatWebSocket';

export const useWebSocket = (
  ws: ChatWebSocket | null,
  onMessage?: (message: any) => void,
  onError?: (error: any) => void,
  onOpen?: () => void,
  onClose?: () => void
) => {
  const callbacksRef = useRef({ onMessage, onError, onOpen, onClose });

  useEffect(() => {
    callbacksRef.current = { onMessage, onError, onOpen, onClose };
  });

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (data: any) => {
      callbacksRef.current.onMessage?.(data);
    };

    const handleError = (data: any) => {
      callbacksRef.current.onError?.(data);
    };

    const handleOpen = () => {
      callbacksRef.current.onOpen?.();
    };

    const handleClose = () => {
      callbacksRef.current.onClose?.();
    };

    ws.on('message', handleMessage);
    ws.on('error', handleError);
    ws.on('open', handleOpen);
    ws.on('close', handleClose);

    return () => {
      ws.off('message', handleMessage);
      ws.off('error', handleError);
      ws.off('open', handleOpen);
      ws.off('close', handleClose);
    };
  }, [ws]);
};


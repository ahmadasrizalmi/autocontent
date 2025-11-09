import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = window.location.origin;

interface WebSocketHook {
  isConnected: boolean;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string) => void;
}

export function useWebSocket(): WebSocketHook {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const listenersRef = useRef<Map<string, (data: any) => void>>(new Map());

  useEffect(() => {
    // Connect to WebSocket
    socketRef.current = io(WS_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('[WebSocket] Connected');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const on = useCallback((event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
      listenersRef.current.set(event, callback);
    }
  }, []);

  const off = useCallback((event: string) => {
    if (socketRef.current && listenersRef.current.has(event)) {
      const callback = listenersRef.current.get(event);
      if (callback) {
        socketRef.current.off(event, callback);
      }
      listenersRef.current.delete(event);
    }
  }, []);

  return { isConnected, on, off };
}

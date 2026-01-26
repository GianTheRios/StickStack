import { useEffect, useRef, useCallback, useState } from 'react';
import type { WebSocketMessage, Task, ClaudeProgress } from '../types';

interface UseWebSocketReturn {
  isConnected: boolean;
  claudeProgress: ClaudeProgress | null;
  onTaskCreated: (callback: (task: Task) => void) => void;
  onTaskUpdated: (callback: (task: Task) => void) => void;
  onTaskDeleted: (callback: (id: string) => void) => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [claudeProgress, setClaudeProgress] = useState<ClaudeProgress | null>(null);

  const taskCreatedCallbackRef = useRef<((task: Task) => void) | null>(null);
  const taskUpdatedCallbackRef = useRef<((task: Task) => void) | null>(null);
  const taskDeletedCallbackRef = useRef<((id: string) => void) | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//localhost:3001`;

    const connect = () => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected, reconnecting...');
        setIsConnected(false);
        setTimeout(connect, 2000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          switch (message.type) {
            case 'task:created':
              taskCreatedCallbackRef.current?.(message.payload as Task);
              break;
            case 'task:updated':
              taskUpdatedCallbackRef.current?.(message.payload as Task);
              break;
            case 'task:deleted':
              taskDeletedCallbackRef.current?.((message.payload as { id: string }).id);
              break;
            case 'claude:progress':
              setClaudeProgress(message.payload as ClaudeProgress);
              break;
            case 'claude:complete':
              setClaudeProgress(null);
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    };

    connect();

    return () => {
      wsRef.current?.close();
    };
  }, []);

  const onTaskCreated = useCallback((callback: (task: Task) => void) => {
    taskCreatedCallbackRef.current = callback;
  }, []);

  const onTaskUpdated = useCallback((callback: (task: Task) => void) => {
    taskUpdatedCallbackRef.current = callback;
  }, []);

  const onTaskDeleted = useCallback((callback: (id: string) => void) => {
    taskDeletedCallbackRef.current = callback;
  }, []);

  return {
    isConnected,
    claudeProgress,
    onTaskCreated,
    onTaskUpdated,
    onTaskDeleted,
  };
}

import { useEffect, useRef, useCallback, useState } from 'react';
import type {
  WebSocketMessage,
  Task,
  ClaudeProgress,
  RalphProgress,
  RalphIterationStartPayload,
  RalphCompletePayload,
} from '../types';

interface UseWebSocketReturn {
  isConnected: boolean;
  claudeProgress: ClaudeProgress | null;
  ralphProgress: RalphProgress | null;
  onTaskCreated: (callback: (task: Task) => void) => void;
  onTaskUpdated: (callback: (task: Task) => void) => void;
  onTaskDeleted: (callback: (id: string) => void) => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [claudeProgress, setClaudeProgress] = useState<ClaudeProgress | null>(null);
  const [ralphProgress, setRalphProgress] = useState<RalphProgress | null>(null);

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
            case 'ralph:iteration_start': {
              const payload = message.payload as RalphIterationStartPayload;
              setRalphProgress({
                taskId: payload.taskId,
                iteration: payload.iteration,
                maxIterations: payload.maxIterations,
                status: 'iterating',
              });
              break;
            }
            case 'ralph:iteration_complete':
              // Keep iterating status, just update will come via iteration_start
              break;
            case 'ralph:complete': {
              const payload = message.payload as RalphCompletePayload;
              setRalphProgress((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  iteration: payload.iteration,
                  status:
                    payload.reason === 'promise_fulfilled'
                      ? 'completed'
                      : payload.reason === 'max_reached'
                        ? 'max_reached'
                        : 'cancelled',
                };
              });
              // Clear after a short delay so UI can show final state
              setTimeout(() => setRalphProgress(null), 2000);
              break;
            }
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
    ralphProgress,
    onTaskCreated,
    onTaskUpdated,
    onTaskDeleted,
  };
}

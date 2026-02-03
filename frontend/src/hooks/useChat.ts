import { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage, ChatResponsePayload } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (content: string, projectDirectory?: string, allowShellCommands?: boolean) => void;
  cancelMessage: () => void;
  clearMessages: () => void;
}

export function useChat(): UseChatReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const currentAssistantMessageRef = useRef<string | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    const connect = () => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onclose = () => {
        setTimeout(connect, 2000);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'chat:response') {
            const payload = message.payload as ChatResponsePayload;

            if (payload.done) {
              setIsLoading(false);
              currentAssistantMessageRef.current = null;
            } else if (payload.content) {
              // Update or create assistant message
              setMessages((prev) => {
                const existingIndex = prev.findIndex(
                  (m) => m.id === payload.messageId
                );

                if (existingIndex >= 0) {
                  // Append to existing message
                  const updated = [...prev];
                  updated[existingIndex] = {
                    ...updated[existingIndex],
                    content: updated[existingIndex].content + payload.content,
                  };
                  return updated;
                } else {
                  // Create new assistant message
                  currentAssistantMessageRef.current = payload.messageId;
                  return [
                    ...prev,
                    {
                      id: payload.messageId,
                      role: 'assistant',
                      content: payload.content,
                      timestamp: new Date().toISOString(),
                    },
                  ];
                }
              });
            }
          }
        } catch (error) {
          console.error('Error parsing chat message:', error);
        }
      };
    };

    connect();

    return () => {
      wsRef.current?.close();
    };
  }, []);

  const sendMessage = useCallback(
    (content: string, projectDirectory?: string, allowShellCommands?: boolean) => {
      if (!content.trim() || !wsRef.current) return;

      // Add user message
      const userMessage: ChatMessage = {
        id: uuidv4(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Send to server
      wsRef.current.send(
        JSON.stringify({
          type: 'chat:send',
          payload: {
            message: content.trim(),
            projectDirectory,
            allowShellCommands,
          },
        })
      );
    },
    []
  );

  const cancelMessage = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'chat:cancel' }));
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    cancelMessage,
    clearMessages,
  };
}

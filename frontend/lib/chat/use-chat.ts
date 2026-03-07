'use client';

import { useState, useCallback } from 'react';
import type { ChatMessage, ChatState } from '@/lib/types/chat';

const generateId = () => Math.random().toString(36).substring(2, 9);

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: '¡Hola! Soy Evo, tu asistente de Evolution OS. ¿En qué puedo ayudarte hoy?',
  timestamp: new Date(),
};

export function useChat() {
  const [state, setState] = useState<ChatState>({
    messages: [WELCOME_MESSAGE],
    isOpen: false,
    isLoading: false,
    error: null,
  });

  const toggleChat = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const openChat = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: true }));
  }, []);

  const closeChat = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || state.isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...state.messages, userMessage]
            .filter((m) => m.role !== 'system' && m.id !== 'welcome')
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar mensaje');
      }

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }));
    }
  }, [state.messages, state.isLoading]);

  const clearChat = useCallback(() => {
    setState((prev) => ({
      ...prev,
      messages: [WELCOME_MESSAGE],
      error: null,
    }));
  }, []);

  return {
    messages: state.messages,
    isOpen: state.isOpen,
    isLoading: state.isLoading,
    error: state.error,
    toggleChat,
    openChat,
    closeChat,
    sendMessage,
    clearChat,
  };
}

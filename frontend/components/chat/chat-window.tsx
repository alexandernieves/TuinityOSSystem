'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Minimize2 } from 'lucide-react';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import type { ChatMessage as ChatMessageType } from '@/lib/types/chat';
import { cn } from '@/lib/utils/cn';

interface ChatWindowProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  error: string | null;
  onSend: (message: string) => void;
  onClose: () => void;
  onClear: () => void;
}

export function ChatWindow({
  messages,
  isLoading,
  error,
  onSend,
  onClose,
  onClear,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'dark fixed bottom-20 right-4 z-50',
        'flex h-[500px] w-[380px] flex-col',
        'overflow-hidden rounded-2xl',
        'border border-[#2a2a2a] bg-[#0a0a0a]',
        'shadow-2xl shadow-black/50'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2a2a2a] bg-[#141414] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00D1B2]">
            <span className="text-lg font-bold text-black">E</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>Asistente Evo</h3>
            <p className="text-xs" style={{ color: '#888888' }}>Evolution OS Support</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onClear}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#666666] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            title="Limpiar chat"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#666666] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            title="Minimizar"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#1a1a1a]">
                <span className="text-sm text-[#00D1B2]">E</span>
              </div>
              <div className="rounded-2xl rounded-bl-md border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#00D1B2] [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#00D1B2] [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#00D1B2] [animation-delay:300ms]" />
                </div>
              </div>
            </motion.div>
          )}

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-lg bg-red-950/50 border border-red-900 px-4 py-2 text-sm text-red-400"
            >
              {error}
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <ChatInput onSend={onSend} isLoading={isLoading} />
    </motion.div>
  );
}

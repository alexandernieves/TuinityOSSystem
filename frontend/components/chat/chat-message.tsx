'use client';

import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { ChatMessage as ChatMessageType } from '@/lib/types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-[#00D1B2] text-black'
            : 'bg-[#1a1a1a] text-[#00D1B2] border border-[#2a2a2a]'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Message Bubble */}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
          isUser
            ? 'bg-[#00D1B2] text-black rounded-br-md'
            : 'bg-[#1a1a1a] text-white border border-[#2a2a2a] rounded-bl-md'
        )}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        <span
          className={cn(
            'mt-1 block text-[10px]',
            isUser ? 'text-black/60' : 'text-[#666666]'
          )}
        >
          {message.timestamp.toLocaleTimeString('es', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </motion.div>
  );
}

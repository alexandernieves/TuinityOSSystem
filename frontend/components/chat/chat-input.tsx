'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (value.trim() && !isLoading && !disabled) {
      onSend(value);
      setValue('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 border-t border-[#2a2a2a] bg-[#0a0a0a] p-3">
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Escribe tu mensaje..."
        disabled={isLoading || disabled}
        rows={1}
        className={cn(
          'flex-1 resize-none rounded-xl border border-[#2a2a2a] bg-[#141414] px-4 py-2.5',
          'text-sm text-white placeholder:text-[#666666]',
          'focus:border-[#00D1B2] focus:outline-none focus:ring-1 focus:ring-[#00D1B2]/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'max-h-32 min-h-[42px]'
        )}
        style={{
          height: 'auto',
          minHeight: '42px',
        }}
      />
      <button
        onClick={handleSend}
        disabled={!value.trim() || isLoading || disabled}
        className={cn(
          'flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl',
          'bg-[#00D1B2] text-black transition-all',
          'hover:bg-[#00D1B2]/90 active:scale-95',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#00D1B2]'
        )}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Send className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}

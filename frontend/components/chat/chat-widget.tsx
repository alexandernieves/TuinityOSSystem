'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { ChatWindow } from './chat-window';
import { useChat } from '@/lib/chat/use-chat';
import { cn } from '@/lib/utils/cn';

export function ChatWidget() {
  const {
    messages,
    isOpen,
    isLoading,
    error,
    toggleChat,
    closeChat,
    sendMessage,
    clearChat,
  } = useChat();

  return (
    <>
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            error={error}
            onSend={sendMessage}
            onClose={closeChat}
            onClear={clearChat}
          />
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={toggleChat}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'fixed bottom-4 right-4 z-50',
          'flex h-12 w-12 items-center justify-center',
          'rounded-full shadow-lg',
          'transition-colors duration-200',
          'bg-[#1a1a1a] text-white border border-[#2a2a2a]',
          'hover:bg-[#2a2a2a]'
        )}
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat de ayuda'}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-5 w-5" style={{ color: '#FFFFFF' }} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle className="h-5 w-5" style={{ color: '#FFFFFF' }} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}

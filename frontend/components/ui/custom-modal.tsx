'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const SIZE_MAP = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
} as const;

type ModalSize = keyof typeof SIZE_MAP;

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: ModalSize;
  /** Allow scrolling inside modal body when content is tall */
  scrollable?: boolean;
}

export function CustomModal({ isOpen, onClose, children, size = 'md', scrollable = false }: CustomModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-100 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'relative w-full rounded-2xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] shadow-2xl',
              SIZE_MAP[size],
              scrollable && 'flex max-h-[85vh] flex-col',
            )}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface CustomModalHeaderProps {
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

export function CustomModalHeader({ children, onClose, className }: CustomModalHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between border-b border-gray-200 dark:border-[#2a2a2a] px-5 py-4', className)}>
      <div className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
        {children}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-[#2a2a2a] dark:hover:text-gray-300 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

interface CustomModalBodyProps {
  children: ReactNode;
  className?: string;
}

export function CustomModalBody({ children, className }: CustomModalBodyProps) {
  return (
    <div className={cn('px-5 py-4 overflow-y-auto', className)}>
      {children}
    </div>
  );
}

interface CustomModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function CustomModalFooter({ children, className }: CustomModalFooterProps) {
  return (
    <div className={cn('flex justify-end gap-2 border-t border-gray-200 dark:border-[#2a2a2a] px-5 py-3', className)}>
      {children}
    </div>
  );
}

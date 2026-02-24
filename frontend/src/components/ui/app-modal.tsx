'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '@/lib/utils';

export type AppModalProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  maxWidthClassName?: string;
  contentClassName?: string;
};

export function AppModal({
  open,
  onClose,
  title,
  subtitle,
  actions,
  children,
  maxWidthClassName,
  contentClassName,
}: AppModalProps) {
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="app-modal"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <motion.button
            aria-label="Cerrar"
            onClick={onClose}
            className="absolute inset-0 bg-black/40 z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'relative z-10 w-full max-h-[90vh] overflow-hidden rounded-2xl border border-border bg-background shadow-xl',
              maxWidthClassName ?? 'max-w-4xl'
            )}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {(title || subtitle || actions) && (
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="min-w-0">
                  {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
                  {title && <div className="text-base font-semibold text-foreground truncate">{title}</div>}
                </div>

                {actions && <div className="flex items-center gap-2">{actions}</div>}
              </div>
            )}

            <div className={cn('p-4 overflow-auto max-h-[calc(90vh-52px)]', contentClassName)}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!mounted || !open) return null;
  return createPortal(modal, document.body);
}

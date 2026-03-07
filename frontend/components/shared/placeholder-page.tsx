'use client';

import { motion } from 'framer-motion';
import { Construction } from 'lucide-react';
import type { ReactNode } from 'react';

interface PlaceholderPageProps {
  title: string;
  description?: string;
  icon?: ReactNode;
}

export function PlaceholderPage({
  title,
  description = 'Este módulo está en desarrollo',
  icon,
}: PlaceholderPageProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-50">
          {icon || <Construction className="h-10 w-10 text-brand-600" />}
        </div>
        <h1 className="text-2xl font-semibold text-text-primary">{title}</h1>
        <p className="mt-2 text-sm text-text-secondary">{description}</p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-warning-bg px-4 py-2 text-sm font-medium text-warning">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-warning"></span>
          </span>
          Próximamente
        </div>
      </motion.div>
    </div>
  );
}

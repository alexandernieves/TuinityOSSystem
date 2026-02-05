'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { AppModal, type AppModalProps } from '@/components/ui/app-modal';

type OpenModalArgs = Omit<AppModalProps, 'open' | 'onClose'>;

type AppModalContextValue = {
  openModal: (args: OpenModalArgs) => void;
  closeModal: () => void;
};

const AppModalContext = createContext<AppModalContextValue | null>(null);

export function AppModalProvider({ children }: { children: React.ReactNode }) {
  const [modalState, setModalState] = useState<OpenModalArgs | null>(null);

  const closeModal = useCallback(() => {
    setModalState(null);
  }, []);

  const openModal = useCallback((args: OpenModalArgs) => {
    setModalState(args);
  }, []);

  const value = useMemo(() => ({ openModal, closeModal }), [openModal, closeModal]);

  return (
    <AppModalContext.Provider value={value}>
      {children}
      <AppModal
        open={modalState !== null}
        onClose={closeModal}
        title={modalState?.title}
        subtitle={modalState?.subtitle}
        actions={modalState?.actions}
        maxWidthClassName={modalState?.maxWidthClassName}
        contentClassName={modalState?.contentClassName}
      >
        {modalState?.children ?? null}
      </AppModal>
    </AppModalContext.Provider>
  );
}

export function useAppModal() {
  const ctx = useContext(AppModalContext);
  if (!ctx) throw new Error('useAppModal must be used within AppModalProvider');
  return ctx;
}

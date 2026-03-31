'use client';

import { FC, ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react';

import { FullscreenViewerContextValue, FullscreenViewerState, ViewerContentType } from '@/src/models/evaluation/detail-panel';

import { FullscreenViewerModal } from '@/src/components/Common/FullscreenViewer/FullscreenViewer';

const FullscreenViewerContext = createContext<FullscreenViewerContextValue | null>(null);

export const useFullscreenViewer = () => {
  const ctx = useContext(FullscreenViewerContext);
  if (!ctx) throw new Error('useFullscreenViewer must be used within FullscreenViewerProvider');
  return ctx;
};

export const FullscreenViewerProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<FullscreenViewerState>({
    isOpen: false,
    title: '',
    content: '',
    contentType: 'text',
  });

  const open = useCallback((title: string, content: string, contentType: ViewerContentType) => {
    setState({ isOpen: true, title, content, contentType });
  }, []);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const value = useMemo(() => ({ open, close }), [open, close]);

  return (
    <FullscreenViewerContext.Provider value={value}>
      {children}
      <FullscreenViewerModal {...state} onClose={close} />
    </FullscreenViewerContext.Provider>
  );
};

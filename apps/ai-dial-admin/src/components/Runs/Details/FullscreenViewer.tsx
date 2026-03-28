'use client';

import { FC, ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { DialCloseButton } from '@epam/ai-dial-ui-kit';
import { IconCopy } from '@tabler/icons-react';
import { createPortal } from 'react-dom';

import { BasicI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { getSuccessNotification } from '@/src/utils/notification';

import { generateLineNumbers, highlightJson } from './json-highlight';

type ContentType = 'json' | 'text';

interface FullscreenViewerState {
  isOpen: boolean;
  title: string;
  content: string;
  contentType: ContentType;
}

interface FullscreenViewerContextValue {
  open: (title: string, content: string, contentType: ContentType) => void;
  close: () => void;
}

const FullscreenViewerContext = createContext<FullscreenViewerContextValue | null>(null);

export const useFullscreenViewer = () => {
  const ctx = useContext(FullscreenViewerContext);
  if (!ctx) throw new Error('useFullscreenViewer must be used within FullscreenViewerProvider');
  return ctx;
};

const FullscreenViewerModal: FC<FullscreenViewerState & { onClose: () => void }> = ({
  isOpen,
  title,
  content,
  contentType,
  onClose,
}) => {
  const t = useI18n();
  const { showNotification } = useNotification();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content);
    showNotification(getSuccessNotification(`${title} ${t(BasicI18nKey.CopiedSuccessfully)}`));
  }, [content, title, showNotification, t]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const displayContent = useMemo(() => {
    if (contentType === 'json') {
      try {
        const formatted = JSON.stringify(JSON.parse(content), null, 2);
        return { html: highlightJson(formatted), lines: generateLineNumbers(formatted), raw: formatted };
      } catch {
        return { html: content, lines: generateLineNumbers(content), raw: content };
      }
    }
    return { html: undefined, text: content, lines: generateLineNumbers(content), raw: content };
  }, [content, contentType]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-blackout"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex flex-col w-[85vw] max-w-[1200px] h-[80vh] bg-layer-1 border border-primary rounded-md overflow-hidden shadow">
        <div className="flex items-center justify-between px-4 py-3 border-b border-secondary shrink-0">
          <h3 className="font-semibold text-sm">{title}</h3>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1 px-2 py-1 text-xs border border-secondary rounded text-secondary hover:text-primary hover:bg-layer-4 transition-colors"
              onClick={handleCopy}
            >
              <IconCopy size={14} />
              {t(ButtonsI18nKey.Copy)}
            </button>
            <DialCloseButton onClose={onClose} />
          </div>
        </div>
        <div className="flex flex-1 overflow-auto min-h-0">
          <div className="py-4 px-3 text-right text-secondary opacity-35 text-[11px] leading-[1.6] font-mono select-none border-r border-tertiary shrink-0 whitespace-pre">
            {displayContent.lines}
          </div>
          {displayContent.html ? (
            <pre
              className="flex-1 min-w-0 p-4 font-mono text-xs leading-[1.6] whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{ __html: displayContent.html }}
            />
          ) : (
            <pre className="flex-1 min-w-0 p-4 font-mono text-xs leading-[1.6] whitespace-pre-wrap break-words">
              {displayContent.text}
            </pre>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export const FullscreenViewerProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<FullscreenViewerState>({
    isOpen: false,
    title: '',
    content: '',
    contentType: 'text',
  });

  const open = useCallback((title: string, content: string, contentType: ContentType) => {
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

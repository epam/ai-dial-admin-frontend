'use client';

import { FC, MouseEvent, useCallback, useEffect, useMemo } from 'react';

import { DialCloseButton } from '@epam/ai-dial-ui-kit';
import { Editor } from '@monaco-editor/react';
import { createPortal } from 'react-dom';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { EDITOR_THEMES_CONFIG } from '@/src/constants/editor';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useTheme } from '@/src/context/ThemeContext';
import { useI18n } from '@/src/locales/client';
import { FullscreenViewerState } from '@/src/models/evaluation/detail-panel';
import { EDITOR_THEMES } from '@/src/types/editor';
import { formatContent } from '@/src/utils/evaluation/detail-panel';

export const FullscreenViewerModal: FC<FullscreenViewerState & { onClose: () => void }> = ({
  isOpen,
  title,
  content,
  contentType,
  onClose,
}) => {
  const t = useI18n();
  const { currentTheme } = useTheme();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const formatted = useMemo(() => formatContent(content, contentType), [content, contentType]);

  const language = useMemo(() => {
    if (contentType === 'json') return 'json';
    try {
      JSON.parse(content);
      return 'json';
    } catch {
      return 'plaintext';
    }
  }, [content, contentType]);

  const handleBackdropClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

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
          <h3 className="font-semibold text-sm truncate mr-4">{title}</h3>
          <div className="flex items-center gap-2 shrink-0">
            <CopyButton buttonLabel={t(ButtonsI18nKey.Copy)} value={formatted} valueLabel={title} />
            <DialCloseButton onClose={onClose} />
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            language={language}
            value={formatted}
            theme={currentTheme}
            beforeMount={(monaco) => {
              monaco?.editor?.defineTheme(currentTheme, EDITOR_THEMES_CONFIG[currentTheme as EDITOR_THEMES]);
            }}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              lineNumbers: 'on',
              folding: true,
              fontSize: 12,
              fontFamily: "'Fira Code', 'Consolas', monospace",
              renderLineHighlight: 'none',
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
            }}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
};

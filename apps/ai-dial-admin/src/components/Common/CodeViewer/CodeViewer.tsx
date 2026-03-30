'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { IconChevronRight, IconCopy, IconMaximize } from '@tabler/icons-react';

import { BasicI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { getSuccessNotification } from '@/src/utils/notification';

import { useFullscreenViewer } from '../FullscreenViewer/FullscreenViewer';
import { formatJsonSize, generateLineNumbers, highlightJson } from '@/src/utils/evaluation/json-highlight';

interface Props {
  title: string;
  content: string;
}

const CodeViewer: FC<Props> = ({ title, content }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const fullscreen = useFullscreenViewer();
  const [isOpen, setIsOpen] = useState(false);

  const formatted = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      return content;
    }
  }, [content]);

  const highlighted = useMemo(() => highlightJson(formatted), [formatted]);
  const lineNumbers = useMemo(() => generateLineNumbers(formatted), [formatted]);
  const size = useMemo(() => formatJsonSize(content), [content]);

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(formatted);
      showNotification(getSuccessNotification(`${title} ${t(BasicI18nKey.CopiedSuccessfully)}`));
    },
    [formatted, title, showNotification, t],
  );

  const handleFullscreen = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      fullscreen.open(title, content, 'json');
    },
    [title, content, fullscreen],
  );

  return (
    <div className="border border-secondary rounded overflow-hidden">
      <div
        className="flex items-center justify-between px-3 py-1.5 bg-layer-3 text-xs cursor-pointer select-none hover:bg-layer-4 transition-colors"
        onClick={() => setIsOpen((prev) => !prev)}
        role="button"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-1.5 text-secondary">
          <IconChevronRight size={12} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
          {title}
        </span>
        <span className="flex items-center gap-1">
          <span className="text-[10px] text-secondary opacity-60 font-mono">{size}</span>
          <button
            className="px-2 py-0.5 border border-secondary rounded text-[10px] text-secondary hover:text-primary hover:bg-layer-4 transition-colors"
            onClick={handleCopy}
          >
            <IconCopy size={12} className="inline -mt-px mr-0.5" />
            {t(ButtonsI18nKey.Copy)}
          </button>
          <button
            className="px-1.5 py-0.5 border border-secondary rounded text-[10px] text-secondary hover:text-primary hover:bg-layer-4 transition-colors"
            onClick={handleFullscreen}
            aria-label="Fullscreen"
          >
            <IconMaximize size={12} />
          </button>
        </span>
      </div>
      {isOpen && (
        <div className="flex bg-layer-0 max-h-[400px] overflow-auto">
          <div className="py-3 px-2 text-right text-secondary opacity-35 text-[11px] leading-[1.6] font-mono select-none border-r border-tertiary shrink-0 whitespace-pre sticky left-0">
            {lineNumbers}
          </div>
          <pre
            className="flex-1 min-w-0 p-3 font-mono text-[11px] leading-[1.6] whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </div>
      )}
    </div>
  );
};

export default CodeViewer;

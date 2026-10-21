'use client';

import { FC, MouseEvent, useCallback, useId, useMemo, useState } from 'react';

import { DialGhostIconButton, ElementSize } from '@epam/ai-dial-ui-kit';
import { Editor } from '@monaco-editor/react';
import { IconChevronRight, IconMaximize } from '@tabler/icons-react';
import classNames from 'classnames';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import FullscreenViewer from '@/src/components/Common/FullscreenViewer/FullscreenViewer';
import { EDITOR_THEMES_CONFIG } from '@/src/constants/editor';
import { useTheme } from '@/src/context/ThemeContext';
import { EDITOR_THEMES } from '@/src/types/editor';
import { ViewerContentType } from '@/src/types/evaluation';
import { formatJsonSize } from '@/src/utils/evaluation/json-highlight';

interface Props {
  title: string;
  content: string;
  hideFullscreen?: boolean;
  // Open on first render, for a caller whose reader has already asked for this body rather than for one of
  // several collapsed blocks in a list.
  defaultOpen?: boolean;
}

const CodeViewer: FC<Props> = ({ title, content, hideFullscreen, defaultOpen = false }) => {
  const { currentTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const formatted = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      return content;
    }
  }, [content]);

  const lineCount = useMemo(() => formatted.split('\n').length, [formatted]);
  const size = useMemo(() => formatJsonSize(content), [content]);

  const onOpenFullscreen = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    setIsFullscreen(true);
  }, []);

  return (
    <>
      <div className="border border-secondary rounded overflow-hidden shrink-0">
        {/* Only the title toggles: copy and fullscreen are buttons of their own and cannot nest inside it. */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-layer-3 tiny select-none">
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-1.5 text-secondary cursor-pointer hover:text-primary transition-colors"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-controls={contentId}
          >
            <IconChevronRight size={12} className={classNames('transition-transform', isOpen && 'rotate-90')} />
            {title}
          </button>
          <span className="flex items-center gap-3">
            <span className="dial-tiny-text text-secondary opacity-60 font-mono">{size}</span>
            <CopyButton value={formatted} valueLabel={title} size={ElementSize.Small} />
            {!hideFullscreen && (
              <DialGhostIconButton
                size={ElementSize.Small}
                icon={<IconMaximize size={16} />}
                onClick={onOpenFullscreen}
              />
            )}
          </span>
        </div>
        {isOpen && (
          <div id={contentId} className="bg-layer-0" style={{ height: Math.min(lineCount * 19 + 24, 400) }}>
            <Editor
              height="100%"
              language="json"
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
                fontSize: 11,
                fontFamily: "'Fira Code', 'Consolas', monospace",
                renderLineHighlight: 'none',
                overviewRulerLanes: 0,
                hideCursorInOverviewRuler: true,
                scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
              }}
            />
          </div>
        )}
      </div>
      {!hideFullscreen && (
        <FullscreenViewer
          isOpen={isFullscreen}
          title={title}
          content={content}
          contentType={ViewerContentType.Json}
          onClose={() => setIsFullscreen(false)}
        />
      )}
    </>
  );
};

export default CodeViewer;

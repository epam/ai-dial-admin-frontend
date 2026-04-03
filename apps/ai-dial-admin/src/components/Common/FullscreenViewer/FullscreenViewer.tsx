'use client';

import { FC, useMemo } from 'react';

import { DialPopup, PopupSize } from '@epam/ai-dial-ui-kit';
import { Editor } from '@monaco-editor/react';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { EDITOR_THEMES_CONFIG } from '@/src/constants/editor';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useTheme } from '@/src/context/ThemeContext';
import { useI18n } from '@/src/locales/client';
import { EDITOR_THEMES } from '@/src/types/editor';
import { ViewerContentType } from '@/src/types/evaluation';
import { formatContent } from '@/src/utils/evaluation/detail-panel';

interface Props {
  isOpen: boolean;
  title: string;
  content: string;
  contentType: ViewerContentType;
  onClose: () => void;
}

// TODO: review after implement Evaluation design, maybe we can reuse this component for other viewers in Evaluation details page
const FullscreenViewer: FC<Props> = ({ isOpen, title, content, contentType, onClose }) => {
  const t = useI18n();
  const { currentTheme } = useTheme();

  const formatted = useMemo(() => formatContent(content, contentType), [content, contentType]);

  const language = useMemo(() => {
    if (contentType === ViewerContentType.Json) return 'json';
    try {
      JSON.parse(content);
      return 'json';
    } catch {
      return 'plaintext';
    }
  }, [content, contentType]);

  return (
    <DialPopup
      onClose={onClose}
      header={title}
      portalId="FullscreenCodeViewer"
      open={isOpen}
      size={PopupSize.Lg}
      className="h-[80vh]"
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-end px-4 py-2 shrink-0">
          <CopyButton buttonLabel={t(ButtonsI18nKey.Copy)} value={formatted} valueLabel={title} />
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
    </DialPopup>
  );
};

export default FullscreenViewer;

'use client';

import { FC, useMemo } from 'react';

import { DiffEditor, Monaco } from '@monaco-editor/react';
import { DialPopup, PopupSize } from '@epam/ai-dial-ui-kit';

import { diffEditorOptions, getDiffEditorTheme } from '@/src/constants/editor';
import { useTheme } from '@/src/context/ThemeContext';
import { EDITOR_THEMES } from '@/src/types/editor';

interface Props {
  isOpen: boolean;
  fieldLabel: string;
  original: string;
  modified: string;
  originalLabel: string;
  modifiedLabel: string;
  onClose: () => void;
}

const FullscreenDiffViewer: FC<Props> = ({
  isOpen,
  fieldLabel,
  original,
  modified,
  originalLabel,
  modifiedLabel,
  onClose,
}) => {
  const { currentTheme } = useTheme();

  const language = useMemo(() => {
    const text = original || modified;
    if (!text) return 'plaintext';
    const trimmed = text.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        JSON.parse(trimmed);
        return 'json';
      } catch {
        return 'plaintext';
      }
    }
    return 'plaintext';
  }, [original, modified]);

  function onBeforeMount(monaco: Monaco) {
    monaco?.editor?.defineTheme(currentTheme, getDiffEditorTheme(currentTheme as EDITOR_THEMES));
  }

  return (
    <DialPopup
      onClose={onClose}
      header={fieldLabel}
      portalId="FullscreenDiffViewer"
      open={isOpen}
      size={PopupSize.Lg}
      className="h-[80vh]"
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center px-4 py-2 shrink-0 text-xs border-b border-secondary">
          <span className="flex-1 text-secondary">{originalLabel}</span>
          <span className="flex-1 text-secondary">{modifiedLabel}</span>
        </div>
        <div className="flex-1 min-h-0">
          <DiffEditor
            original={original}
            modified={modified}
            language={language}
            beforeMount={onBeforeMount}
            height="100%"
            width="100%"
            theme={currentTheme}
            options={diffEditorOptions}
          />
        </div>
      </div>
    </DialPopup>
  );
};

export default FullscreenDiffViewer;

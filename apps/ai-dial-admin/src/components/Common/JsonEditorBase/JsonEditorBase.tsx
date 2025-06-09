'use client';

import { FC } from 'react';

import { EDITOR_THEMES_CONFIG } from '@/src/constants/editor';
import { useTheme } from '@/src/context/ThemeContext';
import { EDITOR_THEMES } from '@/src/types/editor';
import { Editor, Monaco, OnValidate } from '@monaco-editor/react';
import { editor } from 'monaco-editor';

export interface Props {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  onValidateJSON?: OnValidate;
  options?: editor.IStandaloneEditorConstructionOptions;
}

const JsonEditorBase: FC<Props> = ({ value, onChange, onValidateJSON, options }) => {
  const { currentTheme } = useTheme();
  function handleBeforeMount(monaco: Monaco) {
    monaco?.editor?.defineTheme(currentTheme, EDITOR_THEMES_CONFIG[currentTheme as EDITOR_THEMES]);
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      enableSchemaRequest: false,
    });
  }
  return (
    <Editor
      beforeMount={handleBeforeMount}
      height="100%"
      defaultLanguage="json"
      value={value}
      onChange={onChange}
      theme={currentTheme}
      onValidate={onValidateJSON}
      options={{
        minimap: { enabled: false },
        formatOnType: true,
        formatOnPaste: true,
        selectOnLineNumbers: false,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        smoothScrolling: true,
        overviewRulerLanes: 0,
        scrollbar: {
          horizontal: 'hidden',
          verticalScrollbarSize: 4,
          verticalSliderSize: 4,
        },
        ...(options ?? {}),
      }}
    />
  );
};

export default JsonEditorBase;

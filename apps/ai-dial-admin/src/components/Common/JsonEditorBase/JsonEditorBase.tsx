'use client';

import { FC } from 'react';

import { EDITOR_THEMES_CONFIG, editorOptions } from '@/src/constants/editor';
import { useTheme } from '@/src/context/ThemeContext';
import { EDITOR_THEMES } from '@/src/types/editor';
import type { Monaco, OnValidate } from '@monaco-editor/react';
import Editor from '@/src/components/Common/MonacoEditor/Editor';
import type { BundledMonaco } from '@/src/components/Common/MonacoEditor/models';
import type { editor } from 'monaco-editor';

export interface Props {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  onValidateJSON?: OnValidate;
  options?: editor.IStandaloneEditorConstructionOptions;
  language?: string;
  onEditorMount?: (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => void;
  onBeforeMount?: (monaco: Monaco) => void;
}

const JsonEditorBase: FC<Props> = ({
  value,
  onChange,
  onValidateJSON,
  options,
  language = 'json',
  onEditorMount,
  onBeforeMount,
}) => {
  const { currentTheme } = useTheme();
  function handleBeforeMount(monaco: Monaco) {
    monaco?.editor?.defineTheme(currentTheme, EDITOR_THEMES_CONFIG[currentTheme as EDITOR_THEMES]);
    onBeforeMount?.(monaco);

    if (language !== 'json') return;

    (monaco as BundledMonaco).json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      enableSchemaRequest: false,
      schemas: [
        {
          uri: 'http://custom-schema/object-required.json',
          fileMatch: ['*'],
          schema: {
            type: 'object',
            description: 'Top-level value must be an object',
            additionalProperties: true,
          },
        },
      ],
    });
  }

  return (
    <Editor
      beforeMount={handleBeforeMount}
      onMount={onEditorMount}
      height="100%"
      language={language}
      value={value}
      onChange={onChange}
      theme={currentTheme}
      onValidate={onValidateJSON}
      options={{
        ...editorOptions,
        ...(options ?? {}),
        fixedOverflowWidgets: true,
      }}
    />
  );
};

export default JsonEditorBase;

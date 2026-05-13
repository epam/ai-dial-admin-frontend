'use client';

import { FC } from 'react';

import { EDITOR_THEMES_CONFIG, editorOptions } from '@/src/constants/editor';
import { useTheme } from '@/src/context/ThemeContext';
import { EDITOR_THEMES } from '@/src/types/editor';
import { Editor, Monaco, OnValidate } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

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

    // Set JSON language configuration (optional - API may vary by Monaco version)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jsonLang = (monaco.languages as any).json;
      if (jsonLang?.jsonDefaults?.setDiagnosticsOptions) {
        jsonLang.jsonDefaults.setDiagnosticsOptions({
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
    } catch {
      // JSON configuration is optional
    }
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
        ...editorOptions,
        ...(options ?? {}),
        fixedOverflowWidgets: true,
      }}
    />
  );
};

export default JsonEditorBase;

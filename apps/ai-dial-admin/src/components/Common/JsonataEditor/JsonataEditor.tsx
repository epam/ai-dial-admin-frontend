'use client';

import { FC, useCallback, useEffect, useRef } from 'react';

import type { Monaco } from '@monaco-editor/react';
import type { IRange, editor } from 'monaco-editor';

import JsonEditorBase from '@/src/components/Common/JsonEditorBase/JsonEditorBase';
import {
  JSONATA_FUNCTIONS,
  JSONATA_KEYWORDS,
  JSONATA_LANGUAGE_CONFIGURATION,
  JSONATA_LANGUAGE_ID,
  JSONATA_MONARCH_TOKENS,
} from '@/src/components/Common/JsonataEditor/constants';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { JsonataVariable } from '@/src/models/jsonata';

interface Props {
  value: string;
  onChange: (value: string) => void;
  options?: editor.IStandaloneEditorConstructionOptions;
  variables?: JsonataVariable[];
}

const registerJsonataLanguage = (monaco: Monaco) => {
  if (monaco.languages.getLanguages().some((language) => language.id === JSONATA_LANGUAGE_ID)) return;

  monaco.languages.register({ id: JSONATA_LANGUAGE_ID });
  monaco.languages.setMonarchTokensProvider(JSONATA_LANGUAGE_ID, JSONATA_MONARCH_TOKENS);
  monaco.languages.setLanguageConfiguration(JSONATA_LANGUAGE_ID, JSONATA_LANGUAGE_CONFIGURATION);
};

const JsonataEditor: FC<Props> = ({ value, onChange, options, variables }) => {
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const disposablesRef = useRef<{ dispose: () => void }[]>([]);
  const modelIdRef = useRef<string | null>(null);
  const variablesRef = useRef(variables);
  variablesRef.current = variables;

  const onEditorMount = useCallback((editorInstance: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    modelIdRef.current = editorInstance.getModel()?.id ?? null;

    const completionDisposable = monaco.languages.registerCompletionItemProvider(JSONATA_LANGUAGE_ID, {
      triggerCharacters: ['$'],
      provideCompletionItems(model, position) {
        if (model.id !== modelIdRef.current) return { suggestions: [] };

        const word = model.getWordUntilPosition(position);
        const precedingText = model.getValueInRange({
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: 1,
          endColumn: word.startColumn,
        });
        const startColumn = precedingText.endsWith('$') ? word.startColumn - 1 : word.startColumn;
        const range: IRange = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn,
          endColumn: word.endColumn,
        };

        return {
          suggestions: [
            ...(variablesRef.current ?? []).map((variable) => ({
              label: `$${variable.name}`,
              kind: monaco.languages.CompletionItemKind.Variable,
              insertText: `$${variable.name}`,
              detail: variable.description,
              sortText: `!${variable.name}`,
              range,
            })),
            ...JSONATA_FUNCTIONS.map((fn) => ({
              label: fn.label,
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: fn.label,
              detail: fn.signature,
              documentation: fn.description,
              range,
            })),
            ...JSONATA_KEYWORDS.map((keyword) => ({
              label: keyword,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: keyword,
              range,
            })),
          ],
        };
      },
    });

    disposablesRef.current = [completionDisposable];
    editorInstance.onDidDispose(() => disposablesRef.current.forEach((disposable) => disposable.dispose()));
  }, []);

  useEffect(() => () => disposablesRef.current.forEach((disposable) => disposable.dispose()), []);

  return (
    <JsonEditorBase
      language={JSONATA_LANGUAGE_ID}
      value={value}
      onChange={(updated) => onChange(updated ?? '')}
      onBeforeMount={registerJsonataLanguage}
      onEditorMount={onEditorMount}
      options={{ ...(options ?? {}), ...(isReadOnlyAdmin ? { readOnly: true } : {}) }}
    />
  );
};

export default JsonataEditor;

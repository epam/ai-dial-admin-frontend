'use client';

import { FC, useEffect, useRef } from 'react';

import type { Monaco } from '@monaco-editor/react';
import type { IRange, editor, languages } from 'monaco-editor';

import { buildSqlCompletions } from '@/src/components/Analytics/QueryBuilder/utils/sql-completions';
import { formatSql } from '@/src/components/Analytics/QueryBuilder/utils/sql-format';
import JsonEditorBase from '@/src/components/Common/JsonEditorBase/JsonEditorBase';
import { SqlCompletion, SqlCompletionKind } from '@/src/models/analytics/sql';

interface Props {
  value: string;
  onChange: (value: string) => void;
  // Read on every suggestion request, so a caller whose schema changes passes a reader of its latest one.
  // Without it the editor still offers the SQL keywords.
  getCompletions?: () => SqlCompletion[];
  options?: editor.IStandaloneEditorConstructionOptions;
}

const keywordCompletions = () => buildSqlCompletions([], '');

const kindMap = (monaco: Monaco): Record<SqlCompletionKind, languages.CompletionItemKind> => ({
  [SqlCompletionKind.Field]: monaco.languages.CompletionItemKind.Field,
  [SqlCompletionKind.Entity]: monaco.languages.CompletionItemKind.Class,
  [SqlCompletionKind.Keyword]: monaco.languages.CompletionItemKind.Keyword,
  [SqlCompletionKind.Function]: monaco.languages.CompletionItemKind.Function,
});

const SqlCodeEditor: FC<Props> = ({ value, onChange, getCompletions = keywordCompletions, options }) => {
  // Monaco's providers are registered once per editor, so they read the completions through a ref the
  // effect below keeps current; without it a provider would close over the first reader it was given.
  const getCompletionsRef = useRef(getCompletions);
  useEffect(() => {
    getCompletionsRef.current = getCompletions;
  }, [getCompletions]);

  const disposablesRef = useRef<{ dispose: () => void }[]>([]);
  const modelIdRef = useRef<string | null>(null);

  const onEditorMount = (editorInstance: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    modelIdRef.current = editorInstance.getModel()?.id ?? null;
    const kinds = kindMap(monaco);

    // Providers are registered per language, so each one answers only for this editor's own model.
    const completionDisposable = monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems(model, position) {
        if (model.id !== modelIdRef.current) return { suggestions: [] };

        const word = model.getWordUntilPosition(position);
        const range: IRange = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = getCompletionsRef.current().map((c) => ({
          label: c.label,
          kind: kinds[c.kind],
          insertText: c.insertText,
          detail: c.detail,
          range,
        }));
        return { suggestions };
      },
    });

    // Backs Monaco's `formatOnType`/`formatOnPaste` (already on for all editors) so SQL auto-formats as
    // the user types or pastes, with no separate format action or button.
    const formatDisposable = monaco.languages.registerDocumentFormattingEditProvider('sql', {
      provideDocumentFormattingEdits(model) {
        if (model.id !== modelIdRef.current) return [];
        return [{ range: model.getFullModelRange(), text: formatSql(model.getValue()) }];
      },
    });

    disposablesRef.current = [completionDisposable, formatDisposable];
    editorInstance.onDidDispose(() => disposablesRef.current.forEach((d) => d.dispose()));
  };

  // Dispose on unmount as well (onDidDispose may not fire in every teardown path).
  useEffect(() => () => disposablesRef.current.forEach((d) => d.dispose()), []);

  return (
    <JsonEditorBase
      language="sql"
      value={value}
      options={options}
      onChange={(v) => onChange(v ?? '')}
      onEditorMount={onEditorMount}
    />
  );
};

export default SqlCodeEditor;

'use client';

import { FC, useEffect, useRef } from 'react';

import type { Monaco } from '@monaco-editor/react';
import type { IRange, editor, languages } from 'monaco-editor';

import { buildSqlCompletions } from '@/src/components/Analytics/QueryBuilder/utils/sql-completions';
import { formatSql } from '@/src/components/Analytics/QueryBuilder/utils/sql-format';
import JsonEditorBase from '@/src/components/Common/JsonEditorBase/JsonEditorBase';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { QueryFunction } from '@/src/models/analytics/query-function';
import { SqlCompletionKind } from '@/src/models/analytics/sql';

interface Props {
  value: string;
  onChange: (value: string) => void;
  fields: AnalyticsEntityField[];
  entityName: string;
  functions: QueryFunction[];
}

const kindMap = (monaco: Monaco): Record<SqlCompletionKind, languages.CompletionItemKind> => ({
  [SqlCompletionKind.Field]: monaco.languages.CompletionItemKind.Field,
  [SqlCompletionKind.Entity]: monaco.languages.CompletionItemKind.Class,
  [SqlCompletionKind.Keyword]: monaco.languages.CompletionItemKind.Keyword,
  [SqlCompletionKind.Function]: monaco.languages.CompletionItemKind.Function,
});

const SqlEditor: FC<Props> = ({ value, onChange, fields, entityName, functions }) => {
  const schemaRef = useRef({ fields, entityName, functions });
  useEffect(() => {
    schemaRef.current = { fields, entityName, functions };
  }, [fields, entityName, functions]);

  const disposablesRef = useRef<{ dispose: () => void }[]>([]);
  const modelIdRef = useRef<string | null>(null);

  const onEditorMount = (editorInstance: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    modelIdRef.current = editorInstance.getModel()?.id ?? null;
    const kinds = kindMap(monaco);

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

        const { fields: latestFields, entityName: latestEntity, functions: latestFns } = schemaRef.current;
        const suggestions = buildSqlCompletions(latestFields, latestEntity, latestFns).map((c) => ({
          label: c.label,
          kind: kinds[c.kind],
          insertText: c.insertText,
          detail: c.detail,
          range,
        }));
        return { suggestions };
      },
    });

    // Backs Monaco's `formatOnType`/`formatOnPaste` (already on for all editors) so the SQL tab
    // auto-formats as the user types or pastes, with no separate format action or button.
    const formatDisposable = monaco.languages.registerDocumentFormattingEditProvider('sql', {
      provideDocumentFormattingEdits(model) {
        return [{ range: model.getFullModelRange(), text: formatSql(model.getValue()) }];
      },
    });

    disposablesRef.current = [completionDisposable, formatDisposable];
    editorInstance.onDidDispose(() => disposablesRef.current.forEach((d) => d.dispose()));
  };

  // Dispose on unmount as well (onDidDispose may not fire in every teardown path).
  useEffect(() => () => disposablesRef.current.forEach((d) => d.dispose()), []);

  return (
    <JsonEditorBase language="sql" value={value} onChange={(v) => onChange(v ?? '')} onEditorMount={onEditorMount} />
  );
};

export default SqlEditor;

'use client';

import { FC, useCallback, useEffect, useRef } from 'react';

import { Editor, Monaco, OnMount } from '@monaco-editor/react';

import { DIFF_HIGHLIGHT_CLASS_BY_KIND } from '@/src/components/Runs/Details/ValuePopups/constants';
import { EDITOR_THEMES_CONFIG } from '@/src/constants/editor';
import { useTheme } from '@/src/context/ThemeContext';
import { TextDiffRange } from '@/src/models/text-diff';
import { EDITOR_THEMES } from '@/src/types/editor';

type CodeEditor = Parameters<OnMount>[0];
type DecorationsCollection = ReturnType<CodeEditor['createDecorationsCollection']>;

interface Props {
  text: string;
  language: string;
  highlights: TextDiffRange[];
}

const HighlightedEditor: FC<Props> = ({ text, language, highlights }) => {
  const { currentTheme } = useTheme();
  const editorRef = useRef<CodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<DecorationsCollection | null>(null);

  const applyHighlights = useCallback(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor?.getModel();
    if (!editor || !monaco || !model) return;

    const decorations = highlights.map(({ start, end, kind }) => {
      const from = model.getPositionAt(start);
      const to = model.getPositionAt(end);
      return {
        range: new monaco.Range(from.lineNumber, from.column, to.lineNumber, to.column),
        options: { inlineClassName: DIFF_HIGHLIGHT_CLASS_BY_KIND[kind] },
      };
    });

    decorationsRef.current?.clear();
    decorationsRef.current = editor.createDecorationsCollection(decorations);
  }, [highlights]);

  useEffect(() => {
    applyHighlights();
  }, [applyHighlights, text]);

  const onMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;
      applyHighlights();
    },
    [applyHighlights],
  );

  return (
    <Editor
      height="100%"
      language={language}
      value={text}
      theme={currentTheme}
      beforeMount={(monaco) => {
        monaco?.editor?.defineTheme(currentTheme, EDITOR_THEMES_CONFIG[currentTheme as EDITOR_THEMES]);
      }}
      onMount={onMount}
      options={{
        readOnly: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        lineNumbers: 'on',
        folding: language === 'json',
        fontSize: 11,
        fontFamily: "'Fira Code', 'Consolas', monospace",
        renderLineHighlight: 'none',
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
      }}
    />
  );
};

export default HighlightedEditor;

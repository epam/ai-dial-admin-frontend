import { FC } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { useTheme } from '@/src/context/ThemeContext';
import { getDiffEditorTheme } from '@/src/constants/editor';
import { EDITOR_THEMES } from '@/src/types/editor';

interface Props {
  logs: string;
}

const LogViewer: FC<Props> = ({ logs }) => {
  const { currentTheme } = useTheme();

  function handleBeforeMount(monaco: Monaco) {
    monaco.languages.register({ id: 'log' });

    monaco.languages.setMonarchTokensProvider('log', {
      tokenizer: {
        root: [[/.*/, 'log']],
      },
    });

    monaco?.editor?.defineTheme(currentTheme, getDiffEditorTheme(currentTheme as EDITOR_THEMES));
  }

  return (
    <Editor
      beforeMount={handleBeforeMount}
      height="100%"
      defaultLanguage="log"
      value={logs}
      theme={currentTheme}
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
        readOnly: true,
        fontFamily: 'monospace',
        fontSize: 14,
      }}
    />
  );
};

export default LogViewer;

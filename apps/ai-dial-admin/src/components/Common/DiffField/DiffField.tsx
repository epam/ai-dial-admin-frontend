import { FC } from 'react';
import classNames from 'classnames';
import { DiffEditor, Monaco } from '@monaco-editor/react';

import { EDITOR_THEMES } from '@/src/types/editor';
import { useTheme } from '@/src/context/ThemeContext';
import { getDiffEditorTheme } from '@/src/constants/editor';

import Field from '@/src/components/Common/Field/Field';

interface Props {
  original?: string;
  modified?: string;
  fieldTitle: string;
  cssClass?: string;
}

const DiffField: FC<Props> = ({ original, modified, fieldTitle, cssClass }) => {
  const { currentTheme } = useTheme();

  function handleBeforeMount(monaco: Monaco) {
    monaco?.editor?.defineTheme(currentTheme, getDiffEditorTheme(currentTheme as EDITOR_THEMES));
  }

  return (
    <div className={classNames('flex flex-col w-full flex-1', cssClass)}>
      <Field fieldTitle={fieldTitle} />
      <DiffEditor
        original={original}
        modified={modified}
        language={'Markdown'}
        beforeMount={handleBeforeMount}
        height="100%"
        theme={currentTheme}
        options={{
          glyphMargin: false,
          minimap: { enabled: false },
          formatOnType: true,
          formatOnPaste: true,
          selectOnLineNumbers: false,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          smoothScrolling: true,
          overviewRulerLanes: 0,
          readOnly: true,
          renderIndicators: false,
          renderOverviewRuler: false,
          scrollbar: {
            horizontal: 'hidden',
            verticalScrollbarSize: 4,
            verticalSliderSize: 4,
          },
        }}
      />
    </div>
  );
};

export default DiffField;

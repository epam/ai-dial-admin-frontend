import { FC } from 'react';
import classNames from 'classnames';
import { DiffEditor, Monaco } from '@monaco-editor/react';

import { EDITOR_THEMES } from '@/src/types/editor';
import { useTheme } from '@/src/context/ThemeContext';
import { diffEditorOptions, getDiffEditorTheme } from '@/src/constants/editor';

import Field from '@/src/components/Common/Field/Field';

interface Props {
  original?: string;
  modified?: string;
  label: string;
  className?: string;
  language?: string;
}

const DiffField: FC<Props> = ({ original, modified, label, className, language }) => {
  const { currentTheme } = useTheme();

  function handleBeforeMount(monaco: Monaco) {
    monaco?.editor?.defineTheme(currentTheme, getDiffEditorTheme(currentTheme as EDITOR_THEMES));
  }

  return (
    <div className={classNames('flex flex-col w-full flex-1 relative bg-layer-2 pt-2 pl-3', className)}>
      <Field fieldTitle={label} />
      <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
        <DiffEditor
          keepCurrentModifiedModel={true}
          keepCurrentOriginalModel={true}
          original={original}
          modified={modified}
          language={language || 'Markdown'}
          beforeMount={handleBeforeMount}
          height="100%"
          width="100%"
          className="diff-section"
          theme={currentTheme}
          options={diffEditorOptions}
        />
      </div>
    </div>
  );
};

export default DiffField;

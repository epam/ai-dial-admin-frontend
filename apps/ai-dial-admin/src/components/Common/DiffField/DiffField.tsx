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
        keepCurrentModifiedModel={true}
        keepCurrentOriginalModel={true}
        original={original}
        modified={modified}
        language={'Markdown'}
        beforeMount={handleBeforeMount}
        height="100%"
        theme={currentTheme}
        options={diffEditorOptions}
      />
    </div>
  );
};

export default DiffField;

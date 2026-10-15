'use client';

import { Editor, Monaco } from '@monaco-editor/react';
import { FC, useCallback, useMemo } from 'react';

import { editorOptions, getReadOnlyEditorTheme, readOnlySchemaThemeId } from '@/src/constants/editor';
import { useTheme } from '@/src/context/ThemeContext';
import { EDITOR_THEMES } from '@/src/types/editor';

interface Props {
  schema?: object | null;
}

const SchemaViewer: FC<Props> = ({ schema }) => {
  const { currentTheme } = useTheme();
  const themeId = readOnlySchemaThemeId(currentTheme);
  const schemaJson = useMemo(() => JSON.stringify(schema ?? {}, null, 2), [schema]);

  const beforeMount = useCallback(
    (monaco: Monaco) => {
      monaco?.editor?.defineTheme(themeId, getReadOnlyEditorTheme(currentTheme as EDITOR_THEMES));
    },
    [currentTheme, themeId],
  );

  return (
    <div className="h-[400px] overflow-hidden rounded bg-layer-4">
      <Editor
        height="100%"
        language="json"
        value={schemaJson}
        theme={themeId}
        beforeMount={beforeMount}
        options={{
          ...editorOptions,
          readOnly: true,
          stickyScroll: { enabled: false },
          renderLineHighlight: 'none',
          hideCursorInOverviewRuler: true,
        }}
      />
    </div>
  );
};

export default SchemaViewer;

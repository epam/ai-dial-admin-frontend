import { DialGhostIconButton, ElementSize } from '@epam/ai-dial-ui-kit';
import { Editor } from '@monaco-editor/react';
import { IconMinimize } from '@tabler/icons-react';
import { FC } from 'react';

import JsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { EDITOR_THEMES_CONFIG } from '@/src/constants/editor';
import { useTheme } from '@/src/context/ThemeContext';
import { EDITOR_THEMES } from '@/src/types/editor';

interface Props {
  schema?: object | null;
  title: string;
  isFullscreen: boolean;
  setFullScreen: (isFullscreen: boolean) => void;
}
// TODO: review after implement Evaluation design
const SchemaViewer: FC<Props> = ({ schema, title, isFullscreen = false, setFullScreen }) => {
  const { currentTheme } = useTheme();

  return (
    <>
      <div className="h-[400px] overflow-auto">
        <JsonEditor
          entity={schema as object}
          options={{ stickyScroll: { enabled: false }, readOnly: true }}
          setSelectedEntity={() => {}}
        />
      </div>

      {isFullscreen && (
        <div className="absolute top-0 left-0 z-[9999] bg-layer-3 flex flex-col size-full">
          <div className="flex items-center justify-between px-6 py-4 border-b border-primary">
            <h4 className="dial-small-semi">{title}</h4>
            <DialGhostIconButton
              size={ElementSize.Small}
              icon={<IconMinimize size={18} />}
              onClick={() => setFullScreen(false)}
            />
          </div>
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language="json"
              value={JSON.stringify(schema, null, 2)}
              theme={currentTheme}
              beforeMount={(monaco) => {
                monaco?.editor?.defineTheme(currentTheme, EDITOR_THEMES_CONFIG[currentTheme as EDITOR_THEMES]);
              }}
              options={{
                readOnly: true,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                lineNumbers: 'on',
                folding: true,
                fontSize: 14,
                fontFamily: "'Fira Code', 'Consolas', monospace",
                renderLineHighlight: 'none',
                overviewRulerLanes: 0,
                hideCursorInOverviewRuler: true,
                scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default SchemaViewer;

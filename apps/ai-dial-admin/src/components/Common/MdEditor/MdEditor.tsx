// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import '@uiw/react-markdown-preview/markdown.css';
import MDEditor from '@uiw/react-md-editor';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import '@uiw/react-md-editor/markdown-editor.css';

import { FC } from 'react';
import { useTheme } from '@/src/context/ThemeContext';

interface Props {
  content: string;
  onChangeContent?: (content: string) => void;
  readOnly?: boolean;
}

const MdEditor: FC<Props> = ({ content, onChangeContent, readOnly }) => {
  const { currentTheme } = useTheme();
  return (
    <div data-color-mode={currentTheme === 'dark' ? 'dark' : 'light'}>
      <MDEditor
        value={content}
        onChange={readOnly ? undefined : (v) => onChangeContent?.(v || '')}
        preview={readOnly ? 'preview' : 'live'}
        visibleDragbar={!readOnly}
      />
    </div>
  );
};

export default MdEditor;

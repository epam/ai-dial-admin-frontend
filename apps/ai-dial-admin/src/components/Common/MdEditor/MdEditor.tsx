import '@uiw/react-markdown-preview/markdown.css';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';

import { FC } from 'react';
import { useTheme } from '@/src/context/ThemeContext';

interface Props {
  content: string;
  onChangeContent?: (content: string) => void;
}

const MdEditor: FC<Props> = ({ content, onChangeContent }) => {
  const { currentTheme } = useTheme();
  return (
    <div data-color-mode={currentTheme === 'dark' ? 'dark' : 'light'}>
      <MDEditor value={content} onChange={(v) => onChangeContent?.(v || '')} />
    </div>
  );
};

export default MdEditor;

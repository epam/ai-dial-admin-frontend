import '@uiw/react-markdown-preview/markdown.css';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';

import { FC } from 'react';

interface Props {
  content: string;
  onChangeContent?: (content: string) => void;
}

const MdEditor: FC<Props> = ({ content, onChangeContent }) => {
  return (
    <div data-color-mode="dark">
      <MDEditor value={content} onChange={(v) => onChangeContent?.(v || '')} />
    </div>
  );
};

export default MdEditor;

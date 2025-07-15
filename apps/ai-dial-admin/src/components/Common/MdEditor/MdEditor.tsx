import { FC, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import ReactMde from 'react-mde';
import 'react-mde/lib/styles/css/react-mde-all.css';

interface Props {
  content: string;
  onChangeContent?: (content: string) => void;
}

enum SelectedContentView {
  WRITE = 'write',
  PREVIEW = 'preview',
}

const MdEditor: FC<Props> = ({ content, onChangeContent }) => {
  const [selectedTab, setSelectedTab] = useState(SelectedContentView.WRITE);

  return (
    <ReactMde
      value={content}
      onChange={onChangeContent}
      selectedTab={selectedTab}
      onTabChange={(tab) => setSelectedTab(tab as SelectedContentView)}
      generateMarkdownPreview={(markdown: string) => Promise.resolve(<ReactMarkdown>{markdown}</ReactMarkdown>)}
    />
  );
};

export default MdEditor;

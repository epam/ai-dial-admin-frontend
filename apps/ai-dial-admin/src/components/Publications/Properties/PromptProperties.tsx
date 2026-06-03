import { FC } from 'react';

import PromptsList from '@/src/components/Publications/Assets/Prompt/PromptsList';
import { usePromptFolder } from '@/src/context/assets/PromptFolderContext';
import { PromptPublication } from '@/src/models/dial/publications';
import BaseProperties from './BaseProperties';

interface Props {
  publication: PromptPublication;
  onChange?: (publication: PromptPublication) => void;
}

const PromptProperties: FC<Props> = ({ publication, onChange }) => {
  return (
    <div className="flex-1 min-h-0 pt-8">
      <div className="w-full flex flex-col gap-y-8">
        <BaseProperties publication={publication} onChange={onChange} getContext={usePromptFolder} />
        <PromptsList publication={publication} onChange={onChange} />
      </div>
    </div>
  );
};

export default PromptProperties;

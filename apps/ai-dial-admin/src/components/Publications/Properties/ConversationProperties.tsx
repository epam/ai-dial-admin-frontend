import { FC } from 'react';

import { useConversationFolder } from '@/src/context/assets/ConversationsFolderContext';
import { ConversationPublication } from '@/src/models/dial/publications';
import BaseProperties from './BaseProperties';

interface Props {
  publication: ConversationPublication;
  onChange?: (publication: ConversationPublication) => void;
}

const ConversationProperties: FC<Props> = ({ publication, onChange }) => {
  return (
    <div className="flex-1 min-h-0 pt-8">
      <div className="w-full flex flex-col gap-y-8">
        <BaseProperties publication={publication} onChange={onChange} getContext={useConversationFolder} />
      </div>
    </div>
  );
};

export default ConversationProperties;

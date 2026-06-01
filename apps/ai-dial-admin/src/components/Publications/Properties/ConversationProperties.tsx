import { FC } from 'react';

import Properties from '@/src/components/Assets/Conversations/View/Properties';
import { useConversationFolder } from '@/src/context/assets/ConversationsFolderContext';
import { DialConversation } from '@/src/models/dial/conversation';
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
        <Properties selectedConversation={publication.conversations?.[0].conversation as DialConversation} />
        <div className="w-full h-[1px] border-b border-primary"></div>
        <BaseProperties
          publication={publication}
          onChange={onChange}
          getContext={useConversationFolder}
          shouldAbleToCreateNewFolder={false}
        />
      </div>
    </div>
  );
};

export default ConversationProperties;

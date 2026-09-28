'use client';

import { FC, useEffect, useState } from 'react';

import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';
import { DialConversation } from '@/src/models/dial/conversation';
import { deleteConversation } from '@/src/app/[lang]/conversations/actions';
import ConversationHeader from '@/src/components/EntityHeaderControls/ConversationHeader';
import { useConversationFolder } from '@/src/context/assets/ConversationsFolderContext';
import TabsContent from './TabsContent';

interface Props {
  conversation: DialConversation;
}

const ConversationView: FC<Props> = ({ conversation }) => {
  const t = useI18n();
  const tabs = getTabsForAsset(t, ApplicationRoute.Conversations);

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedConversation, setSelectedConversation] = useState(structuredClone(conversation));

  useEffect(() => {
    setSelectedConversation(structuredClone(conversation));
  }, [conversation]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <ConversationHeader
        view={ApplicationRoute.Conversations}
        entity={selectedConversation}
        onRemove={deleteConversation}
        tabs={tabs}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        getAssetContext={useConversationFolder}
      />
      <div className="flex-1 overflow-auto min-h-0">
        <TabsContent activeTab={activeTab} selectedConversation={selectedConversation} />
      </div>
    </div>
  );
};

export default ConversationView;

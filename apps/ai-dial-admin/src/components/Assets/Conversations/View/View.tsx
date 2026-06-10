'use client';

import { FC, useCallback, useEffect, useState } from 'react';

import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';
import { DialConversation } from '@/src/models/dial/conversation';
import { deleteConversation } from '@/src/app/[lang]/conversations/actions';
import ConversationHeader from '@/src/components/EntityHeaderControls/ConversationHeader';
import { getNameVersionFromAsset } from '@/src/utils/entities/versions';
import { getConversationPathWithVersion, getConversationVersions } from './utils';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { useRouter } from 'next/navigation';
import { useConversationFolder } from '@/src/context/assets/ConversationsFolderContext';
import TabsContent from './TabsContent';

interface Props {
  conversation: DialConversation;
  conversations?: DialConversation[] | null;
}

const ConversationView: FC<Props> = ({ conversation, conversations }) => {
  const t = useI18n();
  const router = useRouter();
  const tabs = getTabsForAsset(t, ApplicationRoute.Conversations);

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedConversation, setSelectedConversation] = useState(structuredClone(conversation));
  const [version, setVersion] = useState('');
  const [versions, setVersions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fullName = conversation.path.split('/').pop() || '';
    const { version } = getNameVersionFromAsset(fullName);
    setSelectedConversation(structuredClone(conversation));
    setVersion(version);
    setIsLoading(false);
  }, [conversation]);

  useEffect(() => {
    if (conversation && conversations) {
      const conversationVersions = getConversationVersions(conversation, conversations);
      setVersions(conversationVersions);
    }
  }, [conversation, conversations]);

  const onVersionChange = useCallback(
    (version: string) => {
      if (!conversation) return;

      const fullName = conversation.path.split('/').pop() || '';
      const { name: nameWithoutVersion } = getNameVersionFromAsset(fullName);
      setIsLoading(true);

      router.push(
        getUrnForEntity(ApplicationRoute.Conversations, {
          name: nameWithoutVersion,
          path: getConversationPathWithVersion(conversation, version),
        }),
      );
    },
    [router, conversation],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <ConversationHeader
        view={ApplicationRoute.Conversations}
        entity={selectedConversation}
        onRemove={deleteConversation}
        tabs={tabs}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        version={version}
        versions={versions}
        onVersionChange={onVersionChange}
        isVersionLoading={isLoading}
        getAssetContext={useConversationFolder}
      />
      <div className="flex-1 overflow-auto min-h-0">
        <TabsContent activeTab={activeTab} selectedConversation={selectedConversation} />
      </div>
    </div>
  );
};

export default ConversationView;

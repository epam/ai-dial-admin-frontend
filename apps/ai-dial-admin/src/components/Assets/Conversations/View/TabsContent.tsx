'use client';

import { FC, useMemo } from 'react';

import PropertiesTabContent from '@/src/components/EntityTabs/PropertiesTabContent';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import Properties from './Properties';
import { DialConversation } from '@/src/models/dial/conversation';
import Conversations from './Conversations';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import FoldersStorageLabel from '@/src/components/Assets/Header/FolderStorage';

interface Props {
  activeTab: EntityViewTab;
  selectedConversation: DialConversation;
}

const TabsContent: FC<Props> = ({ activeTab, selectedConversation }) => {
  const t = useI18n();

  const headerPostfix = useMemo(() => {
    return (
      <>
        {selectedConversation.author ? (
          <LabelledText label={t(EntitiesI18nKey.Author)} text={selectedConversation.author} />
        ) : null}
        <FoldersStorageLabel asset={selectedConversation} />
      </>
    );
  }, [selectedConversation, t]);

  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <PropertiesTabContent
          entity={selectedConversation}
          view={ApplicationRoute.Conversations}
          id={selectedConversation.name}
          headerPostfix={headerPostfix}
        >
          <Properties selectedConversation={selectedConversation} />
        </PropertiesTabContent>
      )}

      {activeTab === EntityViewTab.Conversation && <Conversations selectedConversation={selectedConversation} />}
    </>
  );
};

export default TabsContent;

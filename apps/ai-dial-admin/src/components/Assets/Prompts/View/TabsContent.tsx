'use client';

import { FC, useMemo } from 'react';

import FoldersStorageLabel from '@/src/components/Assets/Header/FolderStorage';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import PropertiesTabContent from '@/src/components/EntityTabs/PropertiesTabContent';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import { DialPrompt } from '@/src/models/dial/prompt';
import PromptProperties from './Properties';

interface Props {
  activeTab: EntityViewTab;
  selectedPrompt: DialPrompt;
  onChangePrompt: (prompt: DialPrompt) => void;
}

const TabsContent: FC<Props> = ({ activeTab, onChangePrompt, selectedPrompt }) => {
  const t = useI18n();

  const headerPostfix = useMemo(() => {
    return (
      <>
        <FoldersStorageLabel asset={selectedPrompt} />
      </>
    );
  }, [selectedPrompt]);

  const headerPrefix = useMemo(() => {
    return selectedPrompt.author ? (
      <LabelledText label={t(EntitiesI18nKey.Author)} text={selectedPrompt.author} />
    ) : null;
  }, [selectedPrompt.author, t]);

  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <PropertiesTabContent
          entity={selectedPrompt}
          view={ApplicationRoute.Prompts}
          id={selectedPrompt.name}
          headerPostfix={headerPostfix}
          headerPrefix={headerPrefix}
        >
          <PromptProperties prompt={selectedPrompt} onChangePrompt={onChangePrompt} />
        </PropertiesTabContent>
      )}
    </>
  );
};

export default TabsContent;

'use client';

import { FC } from 'react';

import { DialTranslatorResource } from '@/src/models/dial/resource';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import TranslatorAssetProperties from './Properties';

interface Props {
  activeTab: EntityViewTab;
  selectedTranslator: DialTranslatorResource;
  onChange: (translator: DialTranslatorResource) => void;
}

const TabsContent: FC<Props> = ({ activeTab, selectedTranslator, onChange }) => {
  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <TranslatorAssetProperties asset={selectedTranslator} onChange={onChange} />
      )}
    </>
  );
};

export default TabsContent;

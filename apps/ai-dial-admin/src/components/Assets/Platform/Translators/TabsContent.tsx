'use client';

import { FC } from 'react';

import type { PluginOptions } from '@/src/server/config-entities/read-plugin-options';
import { DialTranslatorResource } from '@/src/models/dial/resource';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import TranslatorAssetProperties from './Properties';

interface Props {
  activeTab: EntityViewTab;
  selectedTranslator: DialTranslatorResource;
  plugins?: PluginOptions;
  onChange: (translator: DialTranslatorResource) => void;
}

const TabsContent: FC<Props> = ({ activeTab, selectedTranslator, plugins, onChange }) => {
  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <TranslatorAssetProperties asset={selectedTranslator} plugins={plugins} onChange={onChange} />
      )}
    </>
  );
};

export default TabsContent;

'use client';

import { FC } from 'react';

import Tools from '@/src/components/Tools/Tools';
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { Toolset } from '@/src/models/dial/toolset';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import PropertiesTabContent from './Properties/TabContent';

interface Props {
  activeTab: EntityViewTab;
  selectedToolset: AssetToolset;
  originalToolset: AssetToolset;
  onChange: (toolset: AssetToolset) => void;
}

const TabsContent: FC<Props> = ({ activeTab, onChange, selectedToolset, originalToolset }) => {
  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <PropertiesTabContent selectedToolset={selectedToolset} onChange={onChange} />
      )}

      {activeTab === EntityViewTab.Tools && (
        <Tools
          isAssetToolset={true}
          originalToolset={originalToolset}
          selectedToolset={selectedToolset}
          onChangeToolset={onChange as (toolset: Toolset) => void}
        />
      )}
    </>
  );
};

export default TabsContent;

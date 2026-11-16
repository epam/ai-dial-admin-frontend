'use client';

import { FC } from 'react';

import { DialPluginResource } from '@/src/models/dial/resource';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import PluginAssetProperties from './Properties';

interface Props {
  activeTab: EntityViewTab;
  selectedPlugin: DialPluginResource;
  onChange: (plugin: DialPluginResource) => void;
}

const TabsContent: FC<Props> = ({ activeTab, selectedPlugin, onChange }) => {
  return (
    <>
      {activeTab === EntityViewTab.Properties && <PluginAssetProperties asset={selectedPlugin} onChange={onChange} />}
    </>
  );
};

export default TabsContent;

'use client';

import { FC } from 'react';

import AdapterModels from '@/src/components/Adapter/ModelsView/AdapterModels';
import PropertiesTabContent from '@/src/components/EntityTabs/PropertiesTabContent';
import EntityAudit from '@/src/components/EntityTabs/Audit/EntityAudit';
import { DialAdapter } from '@/src/models/dial/adapter';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import AdapterProperties from './Properties/Properties';

interface Props {
  activeTab: EntityViewTab;
  selectedAdapter: DialAdapter;
  onChangeAdapter: (adapter: DialAdapter) => void;
}

const TabsContent: FC<Props> = ({ activeTab, selectedAdapter, onChangeAdapter }) => {
  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <PropertiesTabContent entity={selectedAdapter} view={ApplicationRoute.Adapters} id={selectedAdapter.name}>
          <AdapterProperties entity={selectedAdapter} onChangeAdapter={onChangeAdapter} />
        </PropertiesTabContent>
      )}
      {activeTab === EntityViewTab.Models && (
        <AdapterModels adapter={selectedAdapter} onChangeAdapter={onChangeAdapter} />
      )}
      {activeTab === EntityViewTab.Audit && <EntityAudit entity={selectedAdapter} view={ApplicationRoute.Adapters} />}
    </>
  );
};

export default TabsContent;

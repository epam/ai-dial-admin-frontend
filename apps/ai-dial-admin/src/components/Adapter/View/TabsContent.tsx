'use client';

import { FC } from 'react';

import AdapterModels from '@/src/components/Adapter/ModelsView/AdapterModels';
import ContainerStatusBanner from '@/src/components/Deployments/Common/ContainerStatusBanner/ContainerStatusBanner';
import EntityAudit from '@/src/components/EntityTabs/Audit/EntityAudit';
import PropertiesTabContent from '@/src/components/EntityTabs/PropertiesTabContent';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { DialAdapter } from '@/src/models/dial/adapter';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import AdapterProperties from './Properties/Properties';

interface Props {
  activeTab: EntityViewTab;
  selectedAdapter: DialAdapter;
  originalAdapter: DialAdapter;
  onChangeAdapter: (adapter: DialAdapter) => void;
}

const TabsContent: FC<Props> = ({ activeTab, selectedAdapter, originalAdapter, onChangeAdapter }) => {
  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <>
          {originalAdapter.source?.$type === SOURCE_TYPE.CONTAINER && originalAdapter.source?.containerId && (
            <ContainerStatusBanner view={ApplicationRoute.Adapters} containerId={originalAdapter.source.containerId} />
          )}
          <PropertiesTabContent entity={selectedAdapter} view={ApplicationRoute.Adapters} id={selectedAdapter.name}>
            <AdapterProperties entity={selectedAdapter} onChangeAdapter={onChangeAdapter} />
          </PropertiesTabContent>
        </>
      )}
      {activeTab === EntityViewTab.Models && (
        <AdapterModels adapter={selectedAdapter} onChangeAdapter={onChangeAdapter} />
      )}
      {activeTab === EntityViewTab.Audit && <EntityAudit entity={selectedAdapter} view={ApplicationRoute.Adapters} />}
    </>
  );
};

export default TabsContent;

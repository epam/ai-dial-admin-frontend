'use client';

import { FC } from 'react';

import AdapterModels from '@/src/components/Adapter/ModelsView/AdapterModels';
import EntityAudit from '@/src/components/EntityView/Audit/EntityAudit';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import PropertiesTabContent, { PropertiesProps } from './Properties/TabContent';

interface Props extends PropertiesProps {
  activeTab: EntityViewTab;
}

const TabsContent: FC<Props> = ({ activeTab, selectedAdapter, onChangeAdapter }) => {
  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <PropertiesTabContent selectedAdapter={selectedAdapter} onChangeAdapter={onChangeAdapter} />
      )}
      {activeTab === EntityViewTab.Models && (
        <AdapterModels adapter={selectedAdapter} onChangeAdapter={onChangeAdapter} />
      )}
      {activeTab === EntityViewTab.Audit && <EntityAudit entity={selectedAdapter} view={ApplicationRoute.Adapters} />}
    </>
  );
};

export default TabsContent;

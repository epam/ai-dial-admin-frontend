'use client';

import { FC } from 'react';

import EntityAudit from '@/src/components/EntityView/Audit/EntityAudit';
import Interceptors from '@/src/components/InterceptorTemplates/View/Interceptors/Interceptors';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import PropertiesTabContent, { PropertiesProps } from '../Properties/TabContent';

interface Props extends PropertiesProps {
  activeTab: EntityViewTab;
}

const TabsContent: FC<Props> = ({ activeTab, selectedTemplate, onChange }) => {
  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <PropertiesTabContent selectedTemplate={selectedTemplate} onChange={onChange} />
      )}
      {activeTab === EntityViewTab.Interceptors && <Interceptors interceptorList={selectedTemplate.interceptors} />}
      {activeTab === EntityViewTab.Audit && (
        <EntityAudit entity={selectedTemplate} view={ApplicationRoute.InterceptorTemplates} />
      )}
    </>
  );
};

export default TabsContent;

'use client';

import { FC } from 'react';

import EntityAudit from '@/src/components/EntityTabs/Audit/EntityAudit';
import Interceptors from '@/src/components/InterceptorTemplates/View/Interceptors/Interceptors';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import PropertiesTabContent from '@/src/components/EntityTabs/PropertiesTabContent';
import ExtendedProperties from '../Properties/ExtendedProperties';

interface Props {
  activeTab: EntityViewTab;
  selectedTemplate: InterceptorTemplate;
  onChange: (template: InterceptorTemplate) => void;
}

const TabsContent: FC<Props> = ({ activeTab, selectedTemplate, onChange }) => {
  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <PropertiesTabContent
          entity={selectedTemplate}
          view={ApplicationRoute.InterceptorTemplates}
          id={selectedTemplate.name}
        >
          <ExtendedProperties template={selectedTemplate} onChange={onChange} />
        </PropertiesTabContent>
      )}
      {activeTab === EntityViewTab.Interceptors && <Interceptors interceptorList={selectedTemplate.interceptors} />}
      {activeTab === EntityViewTab.Audit && (
        <EntityAudit entity={selectedTemplate} view={ApplicationRoute.InterceptorTemplates} />
      )}
    </>
  );
};

export default TabsContent;

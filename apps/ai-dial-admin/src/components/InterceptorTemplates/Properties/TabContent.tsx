'use client';

import { FC } from 'react';

import EntityInfoHeader from '@/src/components/EntityHeaderControls/Info/InfoHeader';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { ApplicationRoute } from '@/src/types/routes';
import ExtendedProperties from './ExtendedProperties';

export interface PropertiesProps {
  selectedTemplate: InterceptorTemplate;
  onChange: (template: InterceptorTemplate) => void;
}

const PropertiesTabContent: FC<PropertiesProps> = ({ selectedTemplate, onChange }) => {
  return (
    <div className="flex flex-col">
      <EntityInfoHeader
        id={selectedTemplate.name}
        entity={selectedTemplate}
        view={ApplicationRoute.InterceptorTemplates}
      />
      <div className="flex-1 min-h-0 pt-8">
        <ExtendedProperties template={selectedTemplate} onChange={onChange} />
      </div>
    </div>
  );
};

export default PropertiesTabContent;

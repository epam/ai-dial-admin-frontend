'use client';

import { FC } from 'react';

import EntityInfoHeader from '@/src/components/EntityHeaderControls/Info/InfoHeader';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import ExtendedProperties from './ExtendedProperties';

interface Props {
  selectedTemplate: InterceptorTemplate;
  onChange: (template: InterceptorTemplate) => void;
}

const PropertiesTabContent: FC<Props> = ({ selectedTemplate, onChange }) => {
  return (
    <div className="flex flex-col">
      <EntityInfoHeader id={selectedTemplate.name} entity={selectedTemplate} />
      <div className="flex-1 min-h-0 pt-8">
        <ExtendedProperties template={selectedTemplate} onChange={onChange} />
      </div>
    </div>
  );
};

export default PropertiesTabContent;

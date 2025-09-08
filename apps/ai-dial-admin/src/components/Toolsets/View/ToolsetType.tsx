'use client';

import { FC } from 'react';

import RadioField from '@/src/components/Common/RadioField/RadioField';
import { EntitiesI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Toolset } from '@/src/models/dial/toolset';
import { RadioButtonModel } from '@/src/models/radio-button';
import { RadioFieldOrientation } from '@/src/types/radio-orientation';
import { ToolsetTransport } from '@/src/types/toolset';
import EndpointControl from '@/src/components/EntityMainProperties/BaseProperties/Endpoint/Endpoint';

interface Props {
  selectedToolset: Toolset;
  onChangeToolset: (toolset: Toolset) => void;
}

const ToolsetType: FC<Props> = ({ selectedToolset, onChangeToolset }) => {
  const t = useI18n();
  const transportOptions: RadioButtonModel[] = [
    { id: ToolsetTransport.HTTP, name: ToolsetTransport.HTTP.toUpperCase() },
    { id: ToolsetTransport.SSE, name: ToolsetTransport.SSE.toUpperCase() },
  ];

  return (
    <div className="flex flex-col gap-6">
      <EndpointControl
        id="endpoint"
        required={true}
        placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
        fieldTitle={t(EntitiesI18nKey.ExternalEndpoint)}
        endpoint={selectedToolset.endpoint}
        onChange={(endpoint) => onChangeToolset({ ...selectedToolset, endpoint })}
      />
      {!!selectedToolset.allowedTools && (
        <RadioField
          fieldTitle="Transport"
          elementId="transport"
          activeRadioButton={selectedToolset.transport || ToolsetTransport.SSE}
          radioButtons={transportOptions}
          orientation={RadioFieldOrientation.Column}
          onChange={(transport) => onChangeToolset({ ...selectedToolset, transport: transport as ToolsetTransport })}
        />
      )}
    </div>
  );
};

export default ToolsetType;

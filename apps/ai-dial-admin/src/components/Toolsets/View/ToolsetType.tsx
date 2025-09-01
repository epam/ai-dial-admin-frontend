'use client';

import { FC, useCallback, useMemo } from 'react';

import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import RadioField from '@/src/components/Common/RadioField/RadioField';
import { EntitiesI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialToolset } from '@/src/models/dial/toolset';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { RadioButtonModel } from '@/src/models/radio-button';
import { RadioFieldOrientation } from '@/src/types/radio-orientation';
import { ToolsetTransport } from '@/src/types/toolset';
import EndpointControl from '@/src/components/EntityMainProperties/BaseProperties/Endpoint/Endpoint';

interface Props {
  selectedToolset: DialToolset;
  onChangeToolset: (toolset: DialToolset) => void;
}

const ToolsetType: FC<Props> = ({ selectedToolset, onChangeToolset }) => {
  const t = useI18n();
  const selectedType = useMemo(() => {
    return selectedToolset.allowedTools != null ? EntityFieldsI18nKey.allowedTools : EntitiesI18nKey.ExternalEndpoint;
  }, [selectedToolset.allowedTools]);

  const transportOptions: RadioButtonModel[] = [
    { id: ToolsetTransport.HTTP, name: ToolsetTransport.HTTP.toUpperCase() },
    { id: ToolsetTransport.SSE, name: ToolsetTransport.SSE.toUpperCase() },
  ];

  const types: DropdownItemsModel[] = [
    { id: EntityFieldsI18nKey.allowedTools, name: t(EntityFieldsI18nKey.allowedTools) },
    { id: EntitiesI18nKey.ExternalEndpoint, name: t(EntitiesI18nKey.ExternalEndpoint) },
  ];

  const onChangeType = useCallback(
    (type: string) => {
      if (type === EntityFieldsI18nKey.allowedTools) {
        onChangeToolset({ ...selectedToolset, allowedTools: [], endpoint: void 0 });
      } else {
        onChangeToolset({ ...selectedToolset, endpoint: null, allowedTools: void 0 });
      }
    },
    [onChangeToolset, selectedToolset],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-row gap-x-6">
        <DropdownField
          containerCssClass="w-[200px]"
          selectedValue={selectedType}
          elementId="type"
          items={types}
          fieldTitle={t(EntityFieldsI18nKey.type)}
          onChange={onChangeType}
        />

        <div className="flex-1 min-w-0">
          {selectedType === EntitiesI18nKey.ExternalEndpoint && (
            <EndpointControl
              id="endpoint"
              required={true}
              placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
              fieldTitle={t(EntitiesI18nKey.ExternalEndpoint)}
              endpoint={selectedToolset.endpoint}
              onChange={(endpoint) => onChangeToolset({ ...selectedToolset, endpoint })}
            />
          )}
        </div>
      </div>
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

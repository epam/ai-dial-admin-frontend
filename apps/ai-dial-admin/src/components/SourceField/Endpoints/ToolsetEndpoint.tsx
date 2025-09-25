'use client';

import classNames from 'classnames';
import { FC } from 'react';

import { SOURCE_FIELD } from '@/src/components/SourceField/types';
import { EntitiesI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Toolset } from '@/src/models/dial/toolset';
import { ToolsetTransport } from '@/src/types/toolset';

import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import EndpointControl from '@/src/components/EntityMainProperties/BaseProperties/Endpoint/Endpoint';
import { DropdownItemsModel } from '@/src/models/dropdown-item';

interface Props {
  entity: Toolset;
  onChange: (toolset: Toolset) => void;
  prefix?: string;
  isModal?: boolean;
}

const ToolsetEndpoint: FC<Props> = ({ entity, onChange, prefix, isModal }) => {
  const t = useI18n();
  const transportOptions: DropdownItemsModel[] = [
    { id: ToolsetTransport.HTTP, name: ToolsetTransport.HTTP.toUpperCase() },
    { id: ToolsetTransport.SSE, name: ToolsetTransport.SSE.toUpperCase() },
  ];

  return (
    <div className={classNames('flex flex-col gap-6', !isModal && 'lg:w-[35%]')}>
      {prefix ? (
        <EndpointControl
          id="endpoint"
          required={true}
          textBeforeInput={prefix}
          placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
          fieldTitle={t(EntitiesI18nKey.ExternalEndpoint)}
          endpoint={entity.source?.completionEndpointPath}
          onChange={(completionEndpointPath) =>
            onChange({
              ...entity,
              source: { ...entity.source, completionEndpointPath } as SOURCE_FIELD,
            })
          }
        />
      ) : (
        <EndpointControl
          id="endpoint"
          required={true}
          placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
          fieldTitle={t(EntitiesI18nKey.ExternalEndpoint)}
          endpoint={entity.endpoint}
          onChange={(endpoint) => onChange({ ...entity, endpoint })}
        />
      )}
      <DropdownField
        fieldTitle={t(EntityFieldsI18nKey.transport)}
        selectedValue={entity.transport || ToolsetTransport.SSE}
        elementId="transport"
        items={transportOptions}
        onChange={(transport) => onChange({ ...entity, transport: transport as ToolsetTransport })}
      />
    </div>
  );
};

export default ToolsetEndpoint;

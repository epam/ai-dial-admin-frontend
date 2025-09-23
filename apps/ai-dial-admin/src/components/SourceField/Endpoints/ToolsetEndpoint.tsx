'use client';

import { FC } from 'react';
import classNames from 'classnames';

import { EntitiesI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { Toolset } from '@/src/models/dial/toolset';
import { RadioButtonModel } from '@/src/models/radio-button';
import { RadioFieldOrientation } from '@/src/types/radio-orientation';
import { ToolsetTransport } from '@/src/types/toolset';
import { SOURCE_FIELD } from '@/src/components/SourceField/types';
import { useI18n } from '@/src/locales/client';

import RadioField from '@/src/components/Common/RadioField/RadioField';
import EndpointControl from '@/src/components/EntityMainProperties/BaseProperties/Endpoint/Endpoint';

interface Props {
  entity: Toolset;
  onChange: (toolset: Toolset) => void;
  prefix?: string;
  isModal?: boolean;
}

const ToolsetEndpoint: FC<Props> = ({ entity, onChange, prefix, isModal }) => {
  const t = useI18n();
  const transportOptions: RadioButtonModel[] = [
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
      <RadioField
        fieldTitle={t(EntityFieldsI18nKey.transport)}
        elementId="transport"
        activeRadioButton={entity.transport || ToolsetTransport.SSE}
        radioButtons={transportOptions}
        orientation={RadioFieldOrientation.Column}
        onChange={(transport) => onChange({ ...entity, transport: transport as ToolsetTransport })}
      />
    </div>
  );
};

export default ToolsetEndpoint;

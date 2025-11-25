'use client';

import { FC } from 'react';
import classNames from 'classnames';
import { DialSelectField, SelectOption } from '@epam/ai-dial-ui-kit';

import { EntitiesI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { Toolset } from '@/src/models/dial/toolset';
import { ToolsetTransport } from '@/src/types/toolset';
import { useI18n } from '@/src/locales/client';

import ReadonlyField from '@/src/components/Common/ReadonlyField/ReadonlyField';
import EndpointControl from '@/src/components/EntityMainProperties/BaseProperties/Endpoint/Endpoint';

interface Props {
  entity: Toolset;
  onChange?: (toolset: Toolset) => void;
  prefix?: string;
  isModal?: boolean;
  disabled?: boolean;
}

const ToolsetEndpoint: FC<Props> = ({ entity, disabled, onChange, prefix, isModal }) => {
  const t = useI18n();
  const transportOptions: SelectOption[] = [
    { value: ToolsetTransport.HTTP, label: ToolsetTransport.HTTP.toUpperCase() },
    { value: ToolsetTransport.SSE, label: ToolsetTransport.SSE.toUpperCase() },
  ];

  return (
    <div className={classNames('w-full flex flex-col gap-y-8', !isModal && 'lg:w-[45%]')}>
      {prefix ? (
        <ReadonlyField elementId="endpoint" title={t(EntitiesI18nKey.ToolsetEndpoint)} value={prefix} />
      ) : (
        <EndpointControl
          id="endpoint"
          disabled={disabled}
          placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
          fieldTitle={t(EntitiesI18nKey.ExternalEndpoint)}
          endpoint={entity.endpoint}
          onChange={(endpoint) => onChange?.({ ...entity, endpoint })}
          required={true}
        />
      )}
      {!isModal && (
        <DialSelectField
          disabled={disabled}
          fieldTitle={t(EntityFieldsI18nKey.transport)}
          elementId="transport"
          containerCssClass="w-[180px]"
          value={entity.transport || ToolsetTransport.SSE}
          options={transportOptions}
          onChange={(transport) => onChange?.({ ...entity, transport: transport as ToolsetTransport })}
        />
      )}
    </div>
  );
};

export default ToolsetEndpoint;

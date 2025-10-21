'use client';

import { FC } from 'react';
import classNames from 'classnames';
import { DialSelectField, DialTextInputField, SelectOption } from '@epam/ai-dial-ui-kit';

import { EntitiesI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { Toolset } from '@/src/models/dial/toolset';
import { ToolsetTransport } from '@/src/types/toolset';
import { useI18n } from '@/src/locales/client';

import ReadonlyField from '@/src/components/Common/ReadonlyField/ReadonlyField';

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
    <div className={classNames('w-full flex flex-col gap-6', !isModal && ' lg:w-[45%]')}>
      {prefix ? (
        <ReadonlyField elementId="endpoint" title={t(EntitiesI18nKey.ToolsetEndpoint)} value={prefix} />
      ) : (
        <DialTextInputField
          disabled={disabled}
          elementId="endpoint"
          placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
          fieldTitle={t(EntitiesI18nKey.ExternalEndpoint)}
          value={entity.endpoint || ''}
          onChange={(endpoint) => onChange?.({ ...entity, endpoint })}
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

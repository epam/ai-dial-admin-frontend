'use client';

import { FC } from 'react';
import classNames from 'classnames';
import { DialSelect, DialTextInputField, SelectOption } from '@epam/ai-dial-ui-kit';

import { SOURCE_FIELD } from '@/src/components/SourceField/types';
import { EntitiesI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { Toolset } from '@/src/models/dial/toolset';
import { ToolsetTransport } from '@/src/types/toolset';
import { useI18n } from '@/src/locales/client';

import ComplexInput from '@/src/components/Common/ComplexInput/ComplexInput';
import Field from '@/src/components/Common/Field/Field';

interface Props {
  entity: Toolset;
  onChange?: (toolset: Toolset) => void;
  prefix?: string;
  isModal?: boolean;
  readonly?: boolean;
}

const ToolsetEndpoint: FC<Props> = ({ entity, readonly, onChange, prefix, isModal }) => {
  const t = useI18n();
  const transportOptions: SelectOption[] = [
    { value: ToolsetTransport.HTTP, label: ToolsetTransport.HTTP.toUpperCase() },
    { value: ToolsetTransport.SSE, label: ToolsetTransport.SSE.toUpperCase() },
  ];

  return (
    <div className={classNames('flex flex-col gap-6', !isModal && 'lg:w-[35%]')}>
      {prefix ? (
        <ComplexInput
          readonly={readonly}
          elementId="endpoint"
          textBeforeInput={prefix}
          placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
          fieldTitle={t(EntitiesI18nKey.ExternalEndpoint)}
          value={entity.source?.completionEndpointPath}
          fullValue={`${prefix}${entity.source?.completionEndpointPath}`}
          copyable={true}
          onChange={(completionEndpointPath) =>
            onChange?.({
              ...entity,
              source: { ...entity.source, completionEndpointPath } as SOURCE_FIELD,
            })
          }
        />
      ) : (
        <DialTextInputField
          readonly={readonly}
          elementId="endpoint"
          placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
          fieldTitle={t(EntitiesI18nKey.ExternalEndpoint)}
          value={entity.endpoint}
          onChange={(endpoint) => onChange?.({ ...entity, endpoint })}
        />
      )}
      {!isModal && (
        <div className="flex flex-col w-[180px]">
          <Field fieldTitle={t(EntityFieldsI18nKey.transport)} />
          <DialSelect
            value={entity.transport || ToolsetTransport.SSE}
            options={transportOptions}
            onChange={(transport) => onChange?.({ ...entity, transport: transport as ToolsetTransport })}
          />
        </div>
      )}
    </div>
  );
};

export default ToolsetEndpoint;

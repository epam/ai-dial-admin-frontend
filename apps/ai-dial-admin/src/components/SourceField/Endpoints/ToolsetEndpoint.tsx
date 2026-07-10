'use client';

import { FC, useMemo } from 'react';

import { DialSelectField } from '@epam/ai-dial-ui-kit';

import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import ComplexInput from '@/src/components/Common/ComplexInput/ComplexInput';
import { EntitiesI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { TOOLSET_TRANSPORTS } from '@/src/constants/transport';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialToolsetResource } from '@/src/models/dial/resource';
import { Toolset } from '@/src/models/dial/toolset';
import { ToolsetTransport } from '@/src/types/toolset';

interface Props {
  entity: Toolset | DialToolsetResource;
  onChange?: (toolset: Toolset | DialToolsetResource) => void;
  prefix?: string;
  isModal?: boolean;
  disabled?: boolean;
  isAsset?: boolean;
}

const ToolsetEndpoint: FC<Props> = ({ entity, disabled, onChange, prefix, isModal, isAsset }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const isDisabled = disabled || isReadOnlyAdmin;

  const toolsetTransports = useMemo(() => {
    return isAsset
      ? TOOLSET_TRANSPORTS.map((option) => ({ ...option, value: option.value.toUpperCase() }))
      : TOOLSET_TRANSPORTS;
  }, [isAsset]);

  const toolsetTransport = useMemo(() => {
    return entity.transport || (isAsset ? ToolsetTransport.SSE.toUpperCase() : ToolsetTransport.SSE);
  }, [entity.transport, isAsset]);

  return (
    <div className="w-full flex flex-col gap-y-8">
      {prefix ? (
        <ComplexInput copyable disabled id="endpoint" label={t(EntitiesI18nKey.ToolsetEndpoint)} value={prefix} />
      ) : (
        <EndpointControl
          id="endpoint"
          disabled={isDisabled}
          placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
          label={t(EntitiesI18nKey.ExternalEndpoint)}
          endpoint={entity.endpoint}
          onChange={(endpoint) => onChange?.({ ...entity, endpoint })}
          required
          isFullWidth={isModal}
          isModal={isModal}
        />
      )}
      {!isModal && (
        <DialSelectField
          disabled={isDisabled}
          label={t(EntityFieldsI18nKey.transport)}
          id="transport"
          containerClassName="w-[180px]"
          value={toolsetTransport}
          options={toolsetTransports}
          onChange={(transport) => onChange?.({ ...entity, transport: transport as ToolsetTransport })}
        />
      )}
    </div>
  );
};

export default ToolsetEndpoint;

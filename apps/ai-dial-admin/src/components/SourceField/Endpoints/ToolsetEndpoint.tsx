'use client';

import { DialSelectField } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import { EntitiesI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { Toolset } from '@/src/models/dial/toolset';
import { ToolsetTransport } from '@/src/types/toolset';

import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import ReadonlyInput from '@/src/components/Common/ReadonlyInput/ReadonlyInput';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { TOOLSET_TRANSPORTS } from '@/src/constants/transport';

interface Props {
  entity: Toolset;
  onChange?: (toolset: Toolset) => void;
  prefix?: string;
  isModal?: boolean;
  disabled?: boolean;
}

const ToolsetEndpoint: FC<Props> = ({ entity, disabled, onChange, prefix, isModal }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const isDisabled = disabled || isReadOnlyAdmin;

  return (
    <div className="w-full flex flex-col gap-y-8">
      {prefix ? (
        <ReadonlyInput
          containerClassName={STANDARD_CONTROL_WIDTH}
          id="endpoint"
          label={t(EntitiesI18nKey.ToolsetEndpoint)}
          value={prefix}
        />
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
          value={entity.transport || ToolsetTransport.SSE}
          options={TOOLSET_TRANSPORTS}
          onChange={(transport) => onChange?.({ ...entity, transport: transport as ToolsetTransport })}
        />
      )}
    </div>
  );
};

export default ToolsetEndpoint;

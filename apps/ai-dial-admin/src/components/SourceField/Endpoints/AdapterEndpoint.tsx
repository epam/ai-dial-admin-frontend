import { FC } from 'react';

import CompletionEndpointControl from '@/src/components/BaseControls/Endpoint/CompletionEndpoint';
import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';

interface Props {
  entity: DialAdapter;
  onChange: (model: DialAdapter) => void;
  prefix?: string;
  isModal?: boolean;
  disabled?: boolean;
}

const AdapterEndpoint: FC<Props> = ({ entity, onChange, isModal, prefix, disabled }) => {
  const t = useI18n();
  return (
    <div className="w-full flex flex-col gap-y-8">
      {prefix ? (
        <CompletionEndpointControl
          endpoint={entity.source?.completionEndpointPath}
          prefix={prefix}
          onChange={(completionEndpointPath) => {
            onChange({
              ...entity,
              source: { ...entity.source, $type: SOURCE_TYPE.CONTAINER, completionEndpointPath },
            });
          }}
          disabled={disabled}
        />
      ) : (
        <CompletionEndpointControl
          isFullWidth={isModal}
          endpoint={entity.baseEndpoint}
          onChange={(baseEndpoint) => onChange({ ...entity, baseEndpoint })}
          required
          isModal={isModal}
          disabled={disabled}
        />
      )}

      {prefix ? (
        <EndpointControl
          id="responsesEndpoint"
          label={t(EntityFieldsI18nKey.responsesEndpoint)}
          placeholder={t(EntityPlaceholdersI18nKey.ResponsesEndpoint)}
          endpoint={entity.source?.responsesEndpointPath}
          prefix={prefix}
          onChange={(responsesEndpointPath) => {
            onChange({
              ...entity,
              source: { ...entity.source, $type: SOURCE_TYPE.CONTAINER, responsesEndpointPath },
            });
          }}
          disabled={disabled}
        />
      ) : (
        <EndpointControl
          id="responsesEndpoint"
          endpoint={entity.responsesEndpoint}
          label={t(EntityFieldsI18nKey.responsesEndpoint)}
          isFullWidth={isModal}
          placeholder={t(EntityPlaceholdersI18nKey.ResponsesEndpoint)}
          onChange={(responsesEndpoint) => onChange({ ...entity, responsesEndpoint })}
          disabled={disabled}
        />
      )}
    </div>
  );
};

export default AdapterEndpoint;

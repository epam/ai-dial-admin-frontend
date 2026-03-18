import { FC, useCallback } from 'react';

import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialFeatures } from '@/src/models/dial/features';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';

import CompletionEndpointControl from '@/src/components/BaseControls/Endpoint/CompletionEndpoint';
import ConfigurationEndpointControl from '@/src/components/BaseControls/Endpoint/ConfigurationEndpointControl';

interface Props {
  entity: DialInterceptor;
  onChange: (entity: DialInterceptor) => void;
  prefix?: string;
  isModal?: boolean;
}

const InterceptorEndpoint: FC<Props> = ({ entity, onChange, prefix, isModal }) => {
  const onChangeCompletionEndpoint = useCallback(
    (endpoint?: string) => {
      onChange({ ...entity, endpoint });
    },
    [entity, onChange],
  );

  const onChangeConfigurationEndpoint = useCallback(
    (configurationEndpoint?: string) => {
      onChange({
        ...entity,
        features: { configurationEndpoint } as DialFeatures,
      });
    },
    [entity, onChange],
  );

  return (
    <div className="flex flex-col gap-y-8">
      {prefix ? (
        <>
          <CompletionEndpointControl
            endpoint={entity.source?.completionEndpointPath}
            prefix={prefix}
            onChange={(completionEndpointPath) => {
              onChange({
                ...entity,
                source: { ...entity.source, $type: SOURCE_TYPE.CONTAINER, completionEndpointPath },
              });
            }}
          />

          <ConfigurationEndpointControl
            endpoint={entity.source?.configurationEndpointPath}
            prefix={prefix}
            onChange={(configurationEndpointPath) => {
              onChange({
                ...entity,
                source: { ...entity.source, $type: SOURCE_TYPE.CONTAINER, configurationEndpointPath },
              });
            }}
          />
        </>
      ) : (
        <>
          <CompletionEndpointControl
            isFullWidth={isModal}
            endpoint={entity.endpoint}
            onChange={onChangeCompletionEndpoint}
            isModal={isModal}
            required
          />
          {!isModal && (
            <ConfigurationEndpointControl
              endpoint={entity.features?.configurationEndpoint}
              onChange={onChangeConfigurationEndpoint}
            />
          )}
        </>
      )}
    </div>
  );
};

export default InterceptorEndpoint;

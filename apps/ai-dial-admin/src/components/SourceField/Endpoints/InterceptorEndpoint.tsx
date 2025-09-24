import { FC, useCallback } from 'react';

import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialFeatures } from '@/src/models/dial/features';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';

import CompletionEndpointControl from '@/src/components/EntityMainProperties/BaseProperties/Endpoint/CompletionEndpoint';
import ConfigurationEndpointControl from '@/src/components/EntityMainProperties/BaseProperties/Endpoint/ConfigurationEndpointControl';

interface Props {
  entity: DialInterceptor;
  onChange: (entity: DialInterceptor) => void;
  prefix?: string;
}

const InterceptorEndpoint: FC<Props> = ({ entity, onChange, prefix }) => {
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
        features: {
          configurationEndpoint: configurationEndpoint,
        } as DialFeatures,
      });
    },
    [entity, onChange],
  );

  return (
    <div className="lg:w-[35%] flex flex-col gap-6">
      {prefix ? (
        <>
          <CompletionEndpointControl
            endpoint={entity.source?.completionEndpointPath}
            textBeforeInput={prefix}
            onChange={(completionEndpointPath) => {
              onChange({
                ...entity,
                source: { ...entity.source, $type: SOURCE_TYPE.CONTAINER, completionEndpointPath },
              });
            }}
          />

          <ConfigurationEndpointControl
            endpoint={entity.source?.configurationEndpointPath}
            textBeforeInput={prefix}
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
          <CompletionEndpointControl endpoint={entity.endpoint} onChange={onChangeCompletionEndpoint} required={true} />
          <ConfigurationEndpointControl
            endpoint={entity.features?.configurationEndpoint}
            onChange={onChangeConfigurationEndpoint}
          />
        </>
      )}
    </div>
  );
};

export default InterceptorEndpoint;

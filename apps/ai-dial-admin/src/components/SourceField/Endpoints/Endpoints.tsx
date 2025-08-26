import { FC, useCallback } from 'react';

import { DialInterceptor } from '@/src/models/dial/interceptor';
import CompletionEndpointControl from '@/src/components/EntityMainProperties/BaseProperties/Endpoint/CompletionEndpoint';
import ConfigurationEndpointControl from '@/src/components/EntityMainProperties/BaseProperties/Endpoint/ConfigurationEndpointControl';

interface Props {
  entity: DialInterceptor;
  onChange: (entity: DialInterceptor) => void;
}

const Endpoints: FC<Props> = ({ entity, onChange }) => {
  const onChangeCompletionEndpoint = useCallback(
    (endpoint?: string) => {
      onChange({ ...entity, endpoint });
    },
    [entity, onChange],
  );

  const onChangeConfigurationEndpoint = useCallback(
    (configurationEndpoint?: string) => {
      onChange({ ...entity, configurationEndpoint });
    },
    [entity, onChange],
  );

  return (
    <div className="lg:w-[35%] flex flex-col gap-6">
      <CompletionEndpointControl endpoint={entity.endpoint} onChange={onChangeCompletionEndpoint} />
      <ConfigurationEndpointControl endpoint={entity.configurationEndpoint} onChange={onChangeConfigurationEndpoint} />
    </div>
  );
};

export default Endpoints;

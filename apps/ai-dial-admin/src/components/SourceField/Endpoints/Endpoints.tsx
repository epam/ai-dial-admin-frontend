import { FC, useCallback } from 'react';

import { DialInterceptor } from '@/src/models/dial/interceptor';
import CompletionEndpointControl from '@/src/components/EntityMainProperties/BaseProperties/Endpoint/CompletionEndpoint';
import ConfigurationEndpointControl from '@/src/components/EntityMainProperties/BaseProperties/Endpoint/ConfigurationEndpointControl';
import { DialFeatures } from '@/src/models/dial/features';
import classNames from 'classnames';

interface Props {
  entity: DialInterceptor;
  onChange: (entity: DialInterceptor) => void;
  isModal?: boolean;
}

const Endpoints: FC<Props> = ({ entity, onChange, isModal }) => {
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
    <div className={classNames('flex flex-col gap-6', !isModal && 'lg:w-[35%]')}>
      <CompletionEndpointControl endpoint={entity.endpoint} onChange={onChangeCompletionEndpoint} required={true} />
      <ConfigurationEndpointControl
        endpoint={entity.features?.configurationEndpoint}
        onChange={onChangeConfigurationEndpoint}
      />
    </div>
  );
};

export default Endpoints;

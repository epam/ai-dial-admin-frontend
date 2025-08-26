import { FC, useCallback } from 'react';

import { InterceptorTemplate } from '@/src/models/interceptor-template';

import BaseProperties from '@/src/components/InterceptorTemplates/Properties/BaseProperties';
import CompletionEndpointControl from '@/src/components/EntityMainProperties/BaseProperties/Endpoint/CompletionEndpoint';
import ConfigurationEndpointControl from '@/src/components/EntityMainProperties/BaseProperties/Endpoint/ConfigurationEndpointControl';

interface Props {
  template: InterceptorTemplate;
  onChange: (template: InterceptorTemplate) => void;
}

const ExtendedProperties: FC<Props> = ({ template, onChange }) => {
  const onChangeCompletionEndpoint = useCallback(
    (completionEndpoint?: string) => {
      onChange({ ...template, completionEndpoint });
    },
    [template, onChange],
  );

  const onChangeConfigurationEndpoint = useCallback(
    (configurationEndpoint?: string) => {
      onChange({ ...template, configurationEndpoint });
    },
    [template, onChange],
  );

  return (
    <div className="flex flex-col gap-6 mt-3">
      <div className="lg:w-[35%]">
        <BaseProperties template={template} setTemplate={onChange} isImmutable={true} />
      </div>
      <div className="lg:w-[35%] flex flex-col gap-6">
        <CompletionEndpointControl endpoint={template?.completionEndpoint} onChange={onChangeCompletionEndpoint} />
        <ConfigurationEndpointControl
          endpoint={template?.configurationEndpoint}
          onChange={onChangeConfigurationEndpoint}
        />
      </div>
    </div>
  );
};

export default ExtendedProperties;

import { FC, useCallback } from 'react';

import { InterceptorTemplate } from '@/src/models/interceptor-template';

import BaseProperties from '@/src/components/InterceptorTemplates/Properties/BaseProperties';
import CompletionEndpointControl from '@/src/components/BaseControls/Endpoint/CompletionEndpoint';
import ConfigurationEndpointControl from '@/src/components/BaseControls/Endpoint/ConfigurationEndpointControl';
import TopicsControl from '@/src/components/BaseControls/Topics';

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
    <div className="flex flex-col gap-y-8">
      <BaseProperties template={template} onChangeTemplate={onChange} isImmutable={true} />
      <CompletionEndpointControl endpoint={template?.completionEndpoint} onChange={onChangeCompletionEndpoint} />
      <ConfigurationEndpointControl
        endpoint={template?.configurationEndpoint}
        onChange={onChangeConfigurationEndpoint}
      />
      <TopicsControl entity={template} onChange={onChange} />
    </div>
  );
};

export default ExtendedProperties;

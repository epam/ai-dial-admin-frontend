import { FC, useState } from 'react';

import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { CreateI18nKey } from '@/src/constants/i18n';
import { FieldError } from '@/src/models/error';
import { getUrlError } from '@/src/utils/validation/url-error';
import { useI18n } from '@/src/locales/client';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import BaseProperties from '@/src/components/InterceptorTemplates/Properties/BaseProperties';

interface Props {
  template: InterceptorTemplate;
  onChange: (template: InterceptorTemplate) => void;
}

const ExtendedProperties: FC<Props> = ({ template, onChange }) => {
  const t = useI18n() as (key: string) => string;

  const [completionEndpointError, setCompletionEndpointError] = useState<FieldError | null>(null);
  const [configurationEndpointError, setConfigurationEndpointError] = useState<FieldError | null>(null);

  return (
    <div className="flex flex-col gap-6 mt-3">
      <div className="lg:w-[35%]  ">
        <BaseProperties template={template} setTemplate={onChange} isImmutable={true} />
      </div>
      <div className="lg:w-[35%] flex flex-col gap-6">
        <TextInputField
          elementId="completionEndpoint"
          fieldTitle={t(CreateI18nKey.CompletionEndpointTitle)}
          placeholder={t(CreateI18nKey.CompletionEndpointPlaceholder)}
          value={template?.completionEndpoint}
          errorText={completionEndpointError?.text}
          invalid={!!completionEndpointError}
          onChange={(completionEndpoint) => {
            setCompletionEndpointError(getUrlError(completionEndpoint, t));
            onChange({ ...template, completionEndpoint });
          }}
        />
        <TextInputField
          elementId="configurationEndpoint"
          fieldTitle={t(CreateI18nKey.ConfigurationEndpointTitle)}
          placeholder={t(CreateI18nKey.ConfigurationEndpointPlaceholder)}
          value={template.configurationEndpoint}
          errorText={configurationEndpointError?.text}
          invalid={!!configurationEndpointError}
          onChange={(configurationEndpoint) => {
            setConfigurationEndpointError(getUrlError(configurationEndpoint, t));
            onChange({ ...template, configurationEndpoint });
          }}
        />
      </div>
    </div>
  );
};

export default ExtendedProperties;

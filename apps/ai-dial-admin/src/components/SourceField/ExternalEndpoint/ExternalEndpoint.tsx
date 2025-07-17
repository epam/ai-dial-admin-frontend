import { FC, useState } from 'react';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import { CreateI18nKey } from '@/src/constants/i18n';
import { getUrlError } from '@/src/utils/validation/url-error';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';

interface Props {
  template: InterceptorTemplate;
  onChange: (template: InterceptorTemplate) => void;
}

const ExternalEndpoint: FC<Props> = ({ template, onChange }) => {
  const t = useI18n() as (key: string) => string;

  const [completionEndpointError, setCompletionEndpointError] = useState<FieldError | null>(null);
  const [configurationEndpointError, setConfigurationEndpointError] = useState<FieldError | null>(null);

  return (
    <div className="lg:w-[35%] flex flex-col gap-6">
      <TextInputField
        elementId="completionEndpoint"
        fieldTitle={t(CreateI18nKey.CompletionEndpointTitle)}
        placeholder={t(CreateI18nKey.CompletionEndpointPlaceholder)}
        value={template.completionEndpoint}
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
  );
};

export default ExternalEndpoint;

import { FC, useState } from 'react';

import { CreateI18nKey } from '@/src/constants/i18n';
import { FieldError } from '@/src/models/error';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { getUrlError } from '@/src/utils/validation/url-error';
import { useI18n } from '@/src/locales/client';

import { TextInputField } from '@/src/components/Common/InputField/InputField';

interface Props {
  entity: DialInterceptor;
  onChange: (entity: DialInterceptor) => void;
}

const Endpoints: FC<Props> = ({ entity, onChange }) => {
  const t = useI18n() as (key: string) => string;

  const [completionEndpointError, setCompletionEndpointError] = useState<FieldError | null>(null);
  const [configurationEndpointError, setConfigurationEndpointError] = useState<FieldError | null>(null);

  return (
    <div className="lg:w-[35%] flex flex-col gap-6">
      <TextInputField
        elementId="completionEndpoint"
        fieldTitle={t(CreateI18nKey.CompletionEndpointTitle)}
        placeholder={t(CreateI18nKey.CompletionEndpointPlaceholder)}
        value={entity.endpoint}
        errorText={completionEndpointError?.text}
        invalid={!!completionEndpointError}
        onChange={(endpoint) => {
          setCompletionEndpointError(getUrlError(endpoint, t));
          onChange({ ...entity, endpoint });
        }}
      />
      <TextInputField
        elementId="configurationEndpoint"
        fieldTitle={t(CreateI18nKey.ConfigurationEndpointTitle)}
        placeholder={t(CreateI18nKey.ConfigurationEndpointPlaceholder)}
        value={entity.configurationEndpoint}
        errorText={configurationEndpointError?.text}
        invalid={!!configurationEndpointError}
        onChange={(configurationEndpoint) => {
          setConfigurationEndpointError(getUrlError(configurationEndpoint, t));
          onChange({ ...entity, configurationEndpoint });
        }}
      />
    </div>
  );
};

export default Endpoints;

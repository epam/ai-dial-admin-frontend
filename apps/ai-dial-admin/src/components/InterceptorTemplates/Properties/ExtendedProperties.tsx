import { FC, useCallback, useEffect, useMemo } from 'react';

import { CreateI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { getUrlError } from '@/src/utils/validation/url-error';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import BaseProperties from '@/src/components/InterceptorTemplates/Properties/BaseProperties';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';

interface Props {
  template: InterceptorTemplate;
  onChange: (template: InterceptorTemplate) => void;
}

const ExtendedProperties: FC<Props> = ({ template, onChange }) => {
  const t = useI18n() as (key: string) => string;

  const { dispatch } = useSaveValidationContext();

  const completionEndpointError = useMemo(() => {
    return template.completionEndpoint ? getUrlError(template.completionEndpoint, t) : null;
  }, [template.completionEndpoint, t]);
  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'completionEndpoint', isValid: !completionEndpointError });
  }, [completionEndpointError, t, dispatch]);

  const configurationEndpointError = useMemo(() => {
    return template.configurationEndpoint ? getUrlError(template.configurationEndpoint, t) : null;
  }, [template.configurationEndpoint, t]);
  useEffect(() => {
    dispatch({
      type: ValidationActionType.SetField,
      field: 'configurationEndpoint',
      isValid: !configurationEndpointError,
    });
  }, [configurationEndpointError, t, dispatch]);

  const onChangeCompletionEndpoint = useCallback(
    (completionEndpoint: string) => {
      onChange({ ...template, completionEndpoint });
    },
    [template, onChange],
  );

  const onChangeConfigurationEndpoint = useCallback(
    (configurationEndpoint: string) => {
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
        <TextInputField
          elementId="completionEndpoint"
          fieldTitle={t(CreateI18nKey.CompletionEndpointTitle)}
          placeholder={t(CreateI18nKey.CompletionEndpointPlaceholder)}
          value={template?.completionEndpoint}
          errorText={completionEndpointError?.text}
          invalid={!!completionEndpointError}
          onChange={onChangeCompletionEndpoint}
        />
        <TextInputField
          elementId="configurationEndpoint"
          fieldTitle={t(CreateI18nKey.ConfigurationEndpointTitle)}
          placeholder={t(CreateI18nKey.ConfigurationEndpointPlaceholder)}
          value={template.configurationEndpoint}
          errorText={configurationEndpointError?.text}
          invalid={!!configurationEndpointError}
          onChange={onChangeConfigurationEndpoint}
        />
      </div>
    </div>
  );
};

export default ExtendedProperties;

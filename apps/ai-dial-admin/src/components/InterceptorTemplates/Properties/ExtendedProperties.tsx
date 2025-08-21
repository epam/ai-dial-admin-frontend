import { FC, useCallback, useEffect, useMemo } from 'react';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, FeaturesI18nKey } from '@/src/constants/i18n';
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
    return template.completionEndpoint ? getUrlError(template.completionEndpoint, false, t) : null;
  }, [template.completionEndpoint, t]);
  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'completionEndpoint', isValid: !completionEndpointError });
  }, [completionEndpointError, t, dispatch]);

  const configurationEndpointError = useMemo(() => {
    return template.configurationEndpoint ? getUrlError(template.configurationEndpoint, false, t) : null;
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
          fieldTitle={t(EntityFieldsI18nKey.completionEndpoint)}
          placeholder={t(EntityPlaceholdersI18nKey.CompletionEndpoint)}
          value={template?.completionEndpoint}
          errorText={completionEndpointError?.text}
          invalid={!!completionEndpointError}
          onChange={onChangeCompletionEndpoint}
        />
        <TextInputField
          elementId="configurationEndpoint"
          fieldTitle={t(FeaturesI18nKey.configurationEndpoint)}
          placeholder={t(EntityPlaceholdersI18nKey.ConfigurationEndpoint)}
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

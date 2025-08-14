import { FC, useCallback, useEffect, useMemo } from 'react';

import { CreateI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { getUrlError } from '@/src/utils/validation/url-error';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';

interface Props {
  entity: DialInterceptor;
  onChange: (entity: DialInterceptor) => void;
}

const Endpoints: FC<Props> = ({ entity, onChange }) => {
  const t = useI18n() as (key: string) => string;

  const { dispatch } = useSaveValidationContext();

  const completionEndpointError = useMemo(() => {
    return entity.endpoint ? getUrlError(entity.endpoint, t) : null;
  }, [entity.endpoint, t]);
  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'completionEndpoint', isValid: !completionEndpointError });
  }, [completionEndpointError, t, dispatch]);

  const configurationEndpointError = useMemo(() => {
    return entity.configurationEndpoint ? getUrlError(entity.configurationEndpoint, t) : null;
  }, [entity.configurationEndpoint, t]);
  useEffect(() => {
    dispatch({
      type: ValidationActionType.SetField,
      field: 'configurationEndpoint',
      isValid: !configurationEndpointError,
    });
  }, [configurationEndpointError, t, dispatch]);

  const onChangeCompletionEndpoint = useCallback(
    (endpoint: string) => {
      onChange({ ...entity, endpoint });
    },
    [entity, onChange],
  );

  const onChangeConfigurationEndpoint = useCallback(
    (configurationEndpoint: string) => {
      onChange({ ...entity, configurationEndpoint });
    },
    [entity, onChange],
  );

  return (
    <div className="lg:w-[35%] flex flex-col gap-6">
      <TextInputField
        elementId="completionEndpoint"
        fieldTitle={t(CreateI18nKey.CompletionEndpointTitle)}
        placeholder={t(CreateI18nKey.CompletionEndpointPlaceholder)}
        value={entity.endpoint}
        errorText={completionEndpointError?.text}
        invalid={!!completionEndpointError}
        onChange={onChangeCompletionEndpoint}
      />
      <TextInputField
        elementId="configurationEndpoint"
        fieldTitle={t(CreateI18nKey.ConfigurationEndpointTitle)}
        placeholder={t(CreateI18nKey.ConfigurationEndpointPlaceholder)}
        value={entity.configurationEndpoint}
        errorText={configurationEndpointError?.text}
        invalid={!!configurationEndpointError}
        onChange={onChangeConfigurationEndpoint}
      />
    </div>
  );
};

export default Endpoints;

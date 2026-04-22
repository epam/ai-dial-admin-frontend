import { DialInput } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useState } from 'react';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { getErrorForApiKeyHeader } from '@/src/utils/validation/toolset-auth-error';

interface Props {
  apiKeyHeader?: string;
  disabled?: boolean;
  isLoggedIn?: boolean;
  onChange?: (apiKeyHeader: string) => void;
}

const ApiKeyHeaderControl: FC<Props> = ({ apiKeyHeader, disabled, isLoggedIn, onChange }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const [error, setError] = useState<FieldError | null>(null);

  const validate = useCallback(
    (value?: string) => {
      const validationError = getErrorForApiKeyHeader(value, t);
      setError(validationError);

      if (!isLoggedIn) {
        dispatch({
          type: ValidationActionType.SetField,
          field: 'authSettings.apiKeyHeader',
          isValid: !validationError,
        });
      }
    },
    [dispatch, isLoggedIn, t],
  );

  useEffect(() => {
    validate(apiKeyHeader);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKeyHeader]);

  const onChangeApiKeyHeader = useCallback(
    (value?: string) => {
      const trimmed = value?.trimStart() || '';
      validate(trimmed);
      onChange?.(trimmed);
    },
    [onChange, validate],
  );

  return (
    <DialInput
      id="apiKeyHeader"
      labelProps={{ label: t(EntityFieldsI18nKey.apiKeyHeader), required: true }}
      placeholder={t(EntityPlaceholdersI18nKey.Header)}
      value={apiKeyHeader || ''}
      onChange={onChangeApiKeyHeader}
      error={error?.text}
      invalid={!!error}
      disabled={disabled}
    />
  );
};

export default ApiKeyHeaderControl;

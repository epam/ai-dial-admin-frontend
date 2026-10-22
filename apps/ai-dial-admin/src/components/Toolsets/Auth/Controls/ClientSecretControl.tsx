import { PasswordInput } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useState } from 'react';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { getErrorForClientSecret } from '@/src/utils/validation/toolset-auth-error';

interface Props {
  clientSecret?: string;
  disabled?: boolean;
  isLoggedIn?: boolean;
  hasSecretHint?: boolean;
  minLength?: number;
  onChange?: (clientSecret: string) => void;
}

const ClientSecretControl: FC<Props> = ({ clientSecret, disabled, isLoggedIn, hasSecretHint, minLength, onChange }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const [error, setError] = useState<FieldError | null>(null);

  const validate = useCallback(
    (value?: string) => {
      // An empty field next to a stored secret means "unchanged"; Core keeps the stored one.
      const isUnchanged = hasSecretHint && !value?.trim();
      const validationError = isUnchanged ? null : getErrorForClientSecret(value, t, minLength);
      setError(validationError);

      if (!isLoggedIn) {
        dispatch({
          type: ValidationActionType.SetField,
          field: 'authSettings.clientSecret',
          isValid: !validationError,
        });
      }
    },
    [dispatch, t, isLoggedIn, hasSecretHint, minLength],
  );

  useEffect(() => {
    validate(clientSecret);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientSecret, hasSecretHint, minLength]);

  const onChangeClientSecret = useCallback(
    (value?: string) => {
      const trimmed = value?.trimStart() || '';
      validate(trimmed);
      onChange?.(trimmed);
    },
    [onChange, validate],
  );

  return (
    <PasswordInput
      id="clientSecret"
      labelProps={{ label: t(EntityFieldsI18nKey.clientSecret), required: true }}
      placeholder={t(
        hasSecretHint ? EntityPlaceholdersI18nKey.ClientSecretMasked : EntityPlaceholdersI18nKey.ClientSecret,
      )}
      value={clientSecret || ''}
      onChange={onChangeClientSecret}
      error={error?.text}
      invalid={!!error}
      disabled={disabled}
    />
  );
};

export default ClientSecretControl;

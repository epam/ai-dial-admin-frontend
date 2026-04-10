import { DialInput } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useState } from 'react';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { getErrorForClientId } from '@/src/utils/validation/toolset-auth-error';

interface Props {
  clientId?: string;
  disabled?: boolean;
  isLoggedIn?: boolean;
  onChange?: (clientId: string) => void;
}

const ClientIdControl: FC<Props> = ({ clientId, disabled, isLoggedIn, onChange }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const [error, setError] = useState<FieldError | null>(null);

  const validate = useCallback(
    (value?: string) => {
      const validationError = getErrorForClientId(value, t);
      setError(validationError);

      if (!isLoggedIn) {
        dispatch({
          type: ValidationActionType.SetField,
          field: 'authSettings.clientId',
          isValid: !validationError,
        });
      }
    },
    [dispatch, t, isLoggedIn],
  );

  useEffect(() => {
    validate(clientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const onChangeClientId = useCallback(
    (value?: string) => {
      const trimmed = value?.trimStart() || '';
      validate(trimmed);
      onChange?.(trimmed);
    },
    [onChange, validate],
  );

  return (
    <DialInput
      id="clientId"
      labelProps={{ label: t(EntityFieldsI18nKey.clientId), required: true }}
      placeholder={t(EntityPlaceholdersI18nKey.ClientId)}
      value={clientId || ''}
      onChange={onChangeClientId}
      error={error?.text}
      invalid={!!error}
      disabled={disabled}
    />
  );
};

export default ClientIdControl;

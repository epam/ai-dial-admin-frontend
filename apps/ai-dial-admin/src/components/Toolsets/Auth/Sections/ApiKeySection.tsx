import { DialInput } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useState } from 'react';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { ToolsetAuthSettings } from '@/src/models/dial/toolset';
import { FieldError } from '@/src/models/error';
import { getErrorForApiKeyHeader } from '@/src/utils/validation/toolset-auth-error';

interface Props {
  authSettings?: ToolsetAuthSettings;
  disabled?: boolean;
  isLoggedIn?: boolean;
  onChange?: (authSettings: ToolsetAuthSettings) => void;
}

const ApiKeySection: FC<Props> = ({ disabled, authSettings, isLoggedIn, onChange }) => {
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
    [dispatch, t, isLoggedIn],
  );

  useEffect(() => {
    validate(authSettings?.apiKeyHeader);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authSettings?.apiKeyHeader]);

  return (
    <div className="flex flex-col gap-y-4">
      <DialInput
        id="apiKeyHeader"
        labelProps={{ label: t(EntityFieldsI18nKey.apiKeyHeader), required: true }}
        placeholder={t(EntityPlaceholdersI18nKey.Header)}
        value={authSettings?.apiKeyHeader}
        disabled={disabled}
        error={error?.text}
        invalid={!!error}
        onChange={(apiKeyHeader) => onChange?.({ ...(authSettings || {}), apiKeyHeader } as ToolsetAuthSettings)}
      />
    </div>
  );
};

export default ApiKeySection;

import { DialInput } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useState } from 'react';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { getErrorForApiKeyHeader } from '@/src/utils/validation/toolset-auth-error';
import { DialToolsetResourceAuthSettings } from '@/src/models/dial/resource';

interface Props {
  authSettings?: DialToolsetResourceAuthSettings;
  disabled?: boolean;
  isLoggedIn?: boolean;
  onChange?: (authSettings: DialToolsetResourceAuthSettings) => void;
}

const ResourceApiKeySection: FC<Props> = ({ disabled, authSettings, isLoggedIn, onChange }) => {
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
          field: 'authSettings.api_key_header',
          isValid: !validationError,
        });
      }
    },
    [dispatch, t, isLoggedIn],
  );

  useEffect(() => {
    validate(authSettings?.api_key_header);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authSettings?.api_key_header]);

  return (
    <div className="flex flex-col gap-y-4">
      <DialInput
        id="apiKeyHeader"
        labelProps={{ label: t(EntityFieldsI18nKey.apiKeyHeader), required: true }}
        placeholder={t(EntityPlaceholdersI18nKey.Header)}
        value={authSettings?.api_key_header}
        disabled={disabled}
        error={error?.text}
        invalid={!!error}
        onChange={(api_key_header) => onChange?.({ ...(authSettings || {}), api_key_header })}
      />
    </div>
  );
};

export default ResourceApiKeySection;

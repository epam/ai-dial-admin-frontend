import { FC, useEffect, useState } from 'react';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { FieldError } from '@/src/models/error';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getVersionControlError } from '@/src/utils/validation/version-error';
import { useI18n } from '@/src/locales/client';

import { TextInputField } from '@/src/components/Common/InputField/InputField';

interface Props {
  version?: string;
  readonly?: boolean;
  optional?: boolean;
  disabled?: boolean;
  error?: string;
  onChange?: (version?: string) => void;
  hideError?: boolean;
}

const VersionControl: FC<Props> = ({ version, error, optional, hideError, ...props }) => {
  const t = useI18n() as (str: string, options?: Record<string, string | number>) => string;
  const { dispatch } = useSaveValidationContext();

  const [versionError, setVersionError] = useState<FieldError | null>(null);

  useEffect(() => {
    const error = getVersionControlError(version, optional, hideError, t);
    setVersionError(error);
    dispatch({ type: ValidationActionType.SetField, field: 'version', isValid: !error });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, optional, hideError]);

  return (
    <TextInputField
      elementId="displayVersion"
      fieldTitle={t(EntityFieldsI18nKey.displayVersion)}
      placeholder={t(EntityPlaceholdersI18nKey.Version)}
      value={version}
      errorText={error || versionError?.text}
      invalid={!!error || !!versionError}
      optional={optional}
      {...props}
    />
  );
};

export default VersionControl;

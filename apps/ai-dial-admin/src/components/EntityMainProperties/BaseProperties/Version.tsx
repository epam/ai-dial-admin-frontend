import { FC, useCallback, useEffect, useState } from 'react';
import { DialTextInputField } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { FieldError } from '@/src/models/error';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getVersionControlError } from '@/src/utils/validation/version-error';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  version?: string;
  readonly?: boolean;
  optional?: boolean;
  disabled?: boolean;
  containerClassName?: string;
  error?: string;
  onChange?: (version?: string) => void;
  hideError?: boolean;
  title?: string;
  view?: ApplicationRoute;
}

const VersionControl: FC<Props> = ({ version, error, optional, hideError, onChange, title, view, ...props }) => {
  const t = useI18n() as (str: string, options?: Record<string, string | number>) => string;
  const { dispatch } = useSaveValidationContext();

  const [versionError, setVersionError] = useState<FieldError | null>(null);

  const onChangeVersion = useCallback(
    (version?: string) => {
      if (view !== ApplicationRoute.Models) {
        const error = getVersionControlError(version, optional, hideError, t);
        setVersionError(error);
        dispatch({ type: ValidationActionType.SetField, field: 'version', isValid: !error });
      }
      onChange?.(version);
    },
    [dispatch, hideError, onChange, optional, t, view],
  );

  useEffect(() => {
    if (view !== ApplicationRoute.Models) {
      dispatch({ type: ValidationActionType.SetField, field: 'version', isValid: !!version });
    }
  }, [version, optional, view, dispatch]);

  return (
    <DialTextInputField
      elementId="displayVersion"
      fieldTitle={title || t(EntityFieldsI18nKey.version)}
      placeholder={t(EntityPlaceholdersI18nKey.Version)}
      value={version}
      errorText={error || versionError?.text}
      invalid={!!error || !!versionError}
      optional={optional}
      onChange={onChangeVersion}
      {...props}
    />
  );
};

export default VersionControl;

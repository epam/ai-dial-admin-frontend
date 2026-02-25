import { DialInput } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { ApplicationRoute } from '@/src/types/routes';
import { getControlClassName } from '@/src/utils/entities/view';
import { isEntitiesWithDisplayVersion } from '@/src/utils/is-asset-view';
import { getVersionControlError } from '@/src/utils/validation/version-error';

interface Props {
  version?: string;
  optional?: boolean;
  disabled?: boolean;
  containerClassName?: string;
  className?: string;
  error?: string;
  hideError?: boolean;
  title?: string;
  isFullWidth?: boolean;
  view?: ApplicationRoute;
  onChange?: (version?: string) => void;
}

const VersionControl: FC<Props> = ({
  isFullWidth = true,
  version,
  error,
  optional,
  hideError,
  onChange,
  title,
  view,
  ...props
}) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const containerClassName = useMemo(() => getControlClassName(isFullWidth), [isFullWidth]);

  const [versionError, setVersionError] = useState<FieldError | null>(null);

  const onChangeVersion = useCallback(
    (version?: string) => {
      if (!isEntitiesWithDisplayVersion(view)) {
        const error = getVersionControlError(version, optional, hideError, t);
        setVersionError(error);
        dispatch({ type: ValidationActionType.SetField, field: 'version', isValid: !error });
      }
      onChange?.(version);
    },
    [dispatch, hideError, onChange, optional, t, view],
  );

  useEffect(() => {
    if (!isEntitiesWithDisplayVersion(view)) {
      dispatch({ type: ValidationActionType.SetField, field: 'version', isValid: !!version });
    }
  }, [version, optional, view, dispatch]);

  return (
    <DialInput
      id="displayVersion"
      labelProps={{ label: title || t(EntityFieldsI18nKey.version), required: !optional }}
      placeholder={t(EntityPlaceholdersI18nKey.Version)}
      value={version}
      errorText={error || versionError?.text}
      invalid={!!error || !!versionError}
      onChange={onChangeVersion}
      containerClassName={containerClassName}
      {...props}
    />
  );
};

export default VersionControl;

import { FC, useCallback, useEffect, useState, useMemo } from 'react';
import { DialTextInputField } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { FieldError } from '@/src/models/error';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getVersionControlError } from '@/src/utils/validation/version-error';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import { getControlClassName } from '@/src/utils/entities/view';
import { isEntitiesWithDisplayVersion } from '@/src/utils/is-asset-view';

interface Props {
  version?: string;
  optional?: boolean;
  disabled?: boolean;
  containerClassName?: string;
  elementContainerClassName?: string;
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
    <DialTextInputField
      elementId="displayVersion"
      fieldTitle={title || t(EntityFieldsI18nKey.version)}
      placeholder={t(EntityPlaceholdersI18nKey.Version)}
      value={version}
      errorText={error || versionError?.text}
      invalid={!!error || !!versionError}
      optional={optional}
      onChange={onChangeVersion}
      containerClassName={containerClassName}
      {...props}
    />
  );
};

export default VersionControl;

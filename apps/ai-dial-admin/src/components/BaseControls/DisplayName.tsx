import { DialInput } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { ErrorType } from '@/src/types/error-type';
import { getControlClassName } from '@/src/utils/entities/view';
import { getErrorForAppRouteName, getErrorForName } from '@/src/utils/validation/name-error';

interface Props {
  displayName?: string;
  required?: boolean;
  disabled?: boolean;
  isFullWidth?: boolean;
  names?: string[];
  allowWhitespace?: boolean;
  alphanumericOnly?: boolean;
  trackGlobalValidity?: boolean;
  externalError?: string;
  onChange?: (displayName?: string) => void;
}

const DisplayNameControl: FC<Props> = ({
  displayName,
  required,
  isFullWidth = true,
  onChange,
  names,
  allowWhitespace = true,
  alphanumericOnly = false,
  trackGlobalValidity = true,
  externalError,
  disabled,
  ...props
}) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const { dispatch } = useSaveValidationContext();
  const containerClassName = useMemo(() => getControlClassName(isFullWidth), [isFullWidth]);

  const [displayNameError, setDisplayNameError] = useState<FieldError | null>(null);

  const validateDisplayName = useCallback(
    (value?: string) => {
      const error = alphanumericOnly
        ? getErrorForAppRouteName(value, names, t)
        : getErrorForName(value, names, t, false, !allowWhitespace, true);
      setDisplayNameError(error);
      if (trackGlobalValidity) {
        dispatch({ type: ValidationActionType.SetField, field: 'displayName', isValid: !error });
      }
    },
    [dispatch, t, names, allowWhitespace, alphanumericOnly, trackGlobalValidity],
  );

  // initial validation
  useEffect(() => {
    if (displayName) {
      validateDisplayName(displayName);
    } else if (trackGlobalValidity) {
      dispatch({ type: ValidationActionType.SetField, field: 'displayName', isValid: !!displayName });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayName]);

  const onChangeDisplayName = useCallback(
    (value?: string) => {
      const trimmed = value?.trimStart();
      validateDisplayName(trimmed);
      onChange?.(trimmed);
    },
    [onChange, validateDisplayName],
  );

  useEffect(() => {
    if (externalError && trackGlobalValidity) {
      dispatch({ type: ValidationActionType.SetField, field: 'displayName', isValid: false });
    }
  }, [externalError, dispatch, trackGlobalValidity]);

  const activeError: FieldError | null =
    displayNameError ?? (externalError ? { text: externalError, type: ErrorType.EXISTING } : null);

  return (
    <DialInput
      labelProps={{ label: t(EntityFieldsI18nKey.displayName), required }}
      placeholder={t(EntityPlaceholdersI18nKey.DisplayName)}
      id="displayName"
      value={displayName}
      onChange={onChangeDisplayName}
      error={activeError?.text}
      invalid={!!activeError}
      containerClassName={containerClassName}
      disabled={disabled || isReadOnlyAdmin}
      {...props}
    />
  );
};

export default DisplayNameControl;

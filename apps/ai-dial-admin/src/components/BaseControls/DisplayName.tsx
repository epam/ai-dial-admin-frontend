import { DialInput } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { LocalizedText } from '@/src/models/dial/localized';
import { FieldError } from '@/src/models/error';
import { ErrorType } from '@/src/types/error-type';
import { isLocalizedMap, resolveLocalizedText } from '@/src/utils/entities/localized-value';
import { getControlClassName } from '@/src/utils/entities/view';
import { getErrorForAppRouteName, getErrorForName } from '@/src/utils/validation/name-error';

interface Props {
  displayName?: LocalizedText;
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

/**
 * A locale map is shown read-only under its fallback locale: rendering it in an editable text input
 * would serialize the object and overwrite the value on the next save. Validation is skipped for a
 * map, which is a legitimate stored value this control has no rules for.
 */
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
  const isMap = isLocalizedMap(displayName);
  const displayNameText = resolveLocalizedText(displayName);

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
    if (isMap) {
      dispatch({ type: ValidationActionType.SetField, field: 'displayName', isValid: true });
    } else if (displayName) {
      validateDisplayName(displayName as string);
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
      value={displayNameText}
      onChange={onChangeDisplayName}
      error={activeError?.text}
      invalid={!!activeError}
      containerClassName={containerClassName}
      disabled={disabled || isReadOnlyAdmin || isMap}
      {...props}
    />
  );
};

export default DisplayNameControl;

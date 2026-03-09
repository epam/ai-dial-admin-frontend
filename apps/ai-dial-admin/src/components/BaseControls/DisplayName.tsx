import { DialInput } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { getControlClassName } from '@/src/utils/entities/view';
import { getErrorForName } from '@/src/utils/validation/name-error';

interface Props {
  displayName?: string;
  required?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  isFullWidth?: boolean;
  names?: string[];
  allowWhitespace?: boolean;
  onChange?: (displayName?: string) => void;
}

const DisplayNameControl: FC<Props> = ({
  displayName,
  required,
  isFullWidth = true,
  onChange,
  names,
  allowWhitespace = true,
  ...props
}) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const containerClassName = useMemo(() => getControlClassName(isFullWidth), [isFullWidth]);

  const [displayNameError, setDisplayNameError] = useState<FieldError | null>(null);

  const validateDisplayName = useCallback(
    (displayName?: string) => {
      const error = getErrorForName(displayName, names, t, false, !allowWhitespace, true);
      setDisplayNameError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'displayName', isValid: !error });
    },
    [dispatch, t, names, allowWhitespace],
  );

  // initial validation
  useEffect(() => {
    if (displayName) {
      validateDisplayName(displayName);
    } else {
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

  return (
    <DialInput
      labelProps={{ label: t(EntityFieldsI18nKey.displayName), required }}
      placeholder={t(EntityPlaceholdersI18nKey.DisplayName)}
      id="displayName"
      value={displayName}
      onChange={onChangeDisplayName}
      error={displayNameError?.text}
      invalid={!!displayNameError}
      containerClassName={containerClassName}
      {...props}
    />
  );
};

export default DisplayNameControl;

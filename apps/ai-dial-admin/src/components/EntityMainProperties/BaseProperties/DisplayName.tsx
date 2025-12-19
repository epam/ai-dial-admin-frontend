import { DialTextInputField } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useState, useMemo, useEffect } from 'react';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { getControlClassName } from '@/src/utils/entities/view';
import { getErrorForUniqueDisplayName } from '@/src/utils/validation/name-error';

interface Props {
  displayName?: string;
  required?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  isFullWidth?: boolean;
  isUniqueName?: boolean;
  names?: string[];
  onChange?: (displayName?: string) => void;
}

const DisplayNameControl: FC<Props> = ({
  displayName,
  isFullWidth = true,
  onChange,
  required,
  isUniqueName = false,
  names,
  ...props
}) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const containerClassName = useMemo(() => getControlClassName(isFullWidth), [isFullWidth]);

  const [displayNameError, setDisplayNameError] = useState<FieldError | null>(null);

  const validateDisplayName = useCallback(
    (displayName?: string) => {
      const error = getErrorForUniqueDisplayName(displayName, required, t, isUniqueName, names);
      setDisplayNameError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'displayName', isValid: !error });
    },
    [dispatch, required, t, isUniqueName, names],
  );

  // initial validation
  useEffect(() => {
    validateDisplayName(displayName);
  }, [validateDisplayName, displayName]);

  const onChangeDisplayName = useCallback(
    (value?: string) => {
      validateDisplayName(value);
      onChange?.(value);
    },
    [onChange, validateDisplayName],
  );

  return (
    <DialTextInputField
      fieldTitle={t(EntityFieldsI18nKey.displayName)}
      placeholder={t(EntityPlaceholdersI18nKey.DisplayName)}
      elementId="displayName"
      optional={!required}
      value={displayName}
      onChange={onChangeDisplayName}
      errorText={displayNameError?.text}
      invalid={!!displayNameError}
      containerClassName={containerClassName}
      {...props}
    />
  );
};

export default DisplayNameControl;

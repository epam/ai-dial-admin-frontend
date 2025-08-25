import { FC, useCallback, useState } from 'react';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { getErrorForDisplayName } from '@/src/utils/validation/name-error';

interface Props {
  displayName?: string;
  required?: boolean;
  onChange?: (displayName: string) => void;
}

const DisplayNameControl: FC<Props> = ({ displayName, onChange, required }) => {
  const t = useI18n() as (t: string) => string;
  const { dispatch } = useSaveValidationContext();

  const [displayNameError, setDisplayNameError] = useState<FieldError | null>(null);

  const validateDisplayName = useCallback(
    (displayName?: string) => {
      const error = getErrorForDisplayName(displayName, t);
      setDisplayNameError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'displayName', isValid: !error });
    },
    [dispatch, t],
  );

  const onChangeDisplayName = useCallback(
    (value: string) => {
      validateDisplayName(value);
      onChange?.(value);
    },
    [onChange, validateDisplayName],
  );

  return (
    <TextInputField
      fieldTitle={t(EntityFieldsI18nKey.displayName)}
      placeholder={t(EntityPlaceholdersI18nKey.DisplayName)}
      elementId="displayName"
      optional={!required}
      value={displayName}
      optional={true}
      onChange={onChangeDisplayName}
      errorText={displayNameError?.text}
      invalid={!!displayNameError}
    />
  );
};

export default DisplayNameControl;

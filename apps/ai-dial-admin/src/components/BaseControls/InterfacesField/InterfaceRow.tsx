'use client';

import { useCallback, useEffect, useState } from 'react';

import { DialInput, DialRemoveButton } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { getUrlError } from '@/src/utils/validation/url-error';

interface Props {
  fieldId: string;
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onDelete: () => void;
}

const InterfaceRow = ({ fieldId, label, value, disabled, onChange, onDelete }: Props) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();
  const [error, setError] = useState<FieldError | null>(null);

  const validate = useCallback(
    (url?: string, shouldShowError = true) => {
      const urlError = getUrlError(url, t);
      dispatch({ type: ValidationActionType.SetField, field: fieldId, isValid: !urlError });
      if (shouldShowError) {
        setError(urlError);
      }
    },
    [dispatch, fieldId, t],
  );

  useEffect(() => {
    validate(value);

    return () => {
      dispatch({ type: ValidationActionType.RemoveField, field: fieldId });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resetCounter) {
      validate(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetCounter]);

  const onChangeValue = useCallback(
    (newValue?: string) => {
      const trimmedValue = newValue?.trimStart() || '';
      validate(trimmedValue);
      onChange(trimmedValue);
    },
    [onChange, validate],
  );

  return (
    <div className="flex items-end gap-x-2">
      <DialInput
        id={fieldId}
        labelProps={{ label }}
        value={value}
        onChange={onChangeValue}
        disabled={disabled}
        error={error?.text}
        invalid={!!error}
        containerClassName="flex-1"
      />
      {!disabled && <DialRemoveButton aria-label={t(ButtonsI18nKey.Delete)} onClick={onDelete} />}
    </div>
  );
};

export default InterfaceRow;

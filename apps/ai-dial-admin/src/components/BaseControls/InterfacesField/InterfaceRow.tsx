'use client';

import { useCallback, useEffect, useState } from 'react';

import { DialInput, DialRemoveButton } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, InterfacesI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { getUrlError } from '@/src/utils/validation/url-error';

interface Props {
  fieldId: string;
  typeLabel: string;
  baseUrl: string;
  disabled?: boolean;
  onChangeBaseUrl: (value: string) => void;
  onDelete: () => void;
}

const InterfaceRow = ({ fieldId, typeLabel, baseUrl, disabled, onChangeBaseUrl, onDelete }: Props) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();
  const [error, setError] = useState<FieldError | null>(null);

  const validate = useCallback(
    (url?: string, shouldShowError = true) => {
      const urlError = getUrlError(url, t, true);
      dispatch({ type: ValidationActionType.SetField, field: fieldId, isValid: !urlError });
      if (shouldShowError) {
        setError(urlError);
      }
    },
    [dispatch, fieldId, t],
  );

  useEffect(() => {
    validate(baseUrl, false);

    return () => {
      dispatch({ type: ValidationActionType.RemoveField, field: fieldId });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resetCounter) {
      validate(baseUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetCounter]);

  const onChangeBaseUrlValue = useCallback(
    (newValue?: string) => {
      const trimmedValue = newValue?.trimStart() || '';
      validate(trimmedValue);
      onChangeBaseUrl(trimmedValue);
    },
    [onChangeBaseUrl, validate],
  );

  return (
    <div className="flex flex-col gap-y-2">
      <p className="dial-body-text font-semibold text-primary">{typeLabel}</p>
      <div className="flex items-start gap-x-2">
        <DialInput
          id={fieldId}
          labelProps={{ label: t(InterfacesI18nKey.BaseUrl), required: true }}
          placeholder={t(InterfacesI18nKey.BaseUrlPlaceholder, { type: typeLabel })}
          value={baseUrl}
          onChange={onChangeBaseUrlValue}
          disabled={disabled}
          error={error?.text}
          invalid={!!error}
          containerClassName="w-full"
        />
        {!disabled && <DialRemoveButton aria-label={t(ButtonsI18nKey.Delete)} onClick={onDelete} className="mt-7" />}
      </div>
    </div>
  );
};

export default InterfaceRow;

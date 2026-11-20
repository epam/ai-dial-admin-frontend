import { useEffect, useId } from 'react';

import { BaseUrlInterfaceValue } from '@/src/components/BaseControls/InterfacesField/models';
import { hasInvalidCustomTranslatorUrl } from '@/src/components/BaseControls/InterfacesField/utils';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';

export const useCustomTranslatorValidation = (interfaces?: Record<string, BaseUrlInterfaceValue>): boolean => {
  const id = useId();
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();
  const hasInvalidUrl = hasInvalidCustomTranslatorUrl(interfaces, t);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: `custom-translator-${id}`, isValid: !hasInvalidUrl });
  }, [dispatch, hasInvalidUrl, id, resetCounter]);

  useEffect(
    () => () => dispatch({ type: ValidationActionType.RemoveField, field: `custom-translator-${id}` }),
    [dispatch, id],
  );

  return hasInvalidUrl;
};

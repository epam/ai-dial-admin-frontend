import { ErrorI18nKey } from '@/src/constants/i18n';
import { FieldError } from '@/src/models/error';
import { ErrorType } from '@/src/types/error-type';

export const getErrorForClientId = (clientId?: string, t?: (str: string) => string): FieldError | null => {
  if (!clientId || clientId.trim().length === 0) {
    return {
      type: ErrorType.EMPTY,
      text: t ? t(ErrorI18nKey.RequiredField) : '',
    };
  }
  return null;
};

export const getErrorForClientSecret = (clientSecret?: string, t?: (str: string) => string): FieldError | null => {
  if (!clientSecret || clientSecret.trim().length === 0) {
    return {
      type: ErrorType.EMPTY,
      text: t ? t(ErrorI18nKey.RequiredField) : '',
    };
  }
  return null;
};

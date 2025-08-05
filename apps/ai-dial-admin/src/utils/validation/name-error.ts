import { CreateI18nKey } from '@/src/constants/i18n';
import { MAX_NAME_SYMBOLS, MIN_NAME_SYMBOLS } from '@/src/constants/validation';
import { ErrorType } from '@/src/types/error-type';
import { ApplicationRoute } from '@/src/types/routes';

export const getErrorForName = (
  name?: string,
  names?: string[],
  t?: (str: string) => string,
  isUniqueError?: boolean,
) => {
  const isIncludesName = name && names?.includes(name);
  const isWrongLength = isWrongFieldLength(name || '');

  if (isIncludesName) {
    return {
      type: ErrorType.EXISTING,
      text: t ? t(CreateI18nKey.ErrorName) : '',
    };
  }

  if (isWrongLength) {
    return {
      type: ErrorType.LENGTH,
      text: t ? t(CreateI18nKey.LengthError) : '',
    };
  }

  if (isUniqueError) {
    return {
      type: ErrorType.EXISTING,
      text: t ? t(CreateI18nKey.ErrorUnique) : '',
    };
  }
  return null;
};

export const isWrongLengthWithView = (view: ApplicationRoute, value?: string): boolean => {
  if (view === ApplicationRoute.Applications || view === ApplicationRoute.Models) {
    return value != null ? isWrongFieldLength(value) : false;
  }

  return false;
};

export const isWrongFieldLength = (value: string): boolean => {
  return value.length < MIN_NAME_SYMBOLS || value.length > MAX_NAME_SYMBOLS;
};

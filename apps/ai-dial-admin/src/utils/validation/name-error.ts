import { ErrorI18nKey } from '@/src/constants/i18n';
import { MAX_NAME_SYMBOLS, MIN_NAME_SYMBOLS } from '@/src/constants/validation';
import { ErrorType } from '@/src/types/error-type';
import { ApplicationRoute } from '@/src/types/routes';

export const forbiddenNameSymbols = ['%', '/', '\\', ';'];

export const getErrorForName = (
  name?: string,
  names?: string[],
  t?: (str: string) => string,
  isUniqueError?: boolean,
  checkForbiddenChars = true,
) => {
  if (isUniqueError) {
    return {
      type: ErrorType.EXISTING,
      text: t ? t(ErrorI18nKey.Unique) : '',
    };
  }

  const isIncludesName = name && names?.includes(name);
  if (isIncludesName) {
    return {
      type: ErrorType.EXISTING,
      text: t ? t(ErrorI18nKey.NameExists) : '',
    };
  }

  const tWithArgs = t as (str: string, args?: Record<string, string | number>) => string;
  const isWrongLength = isWrongFieldLength(name || '');
  if (isWrongLength) {
    return {
      type: ErrorType.LENGTH,
      text: t ? tWithArgs(ErrorI18nKey.MinMaxLength, { min: MIN_NAME_SYMBOLS, max: MAX_NAME_SYMBOLS }) : '',
    };
  }

  if (checkForbiddenChars) {
    const hasForbiddenChars = hasInvalidCharacters(name);
    if (hasForbiddenChars) {
      return {
        type: ErrorType.FORBIDDEN_CHARS,
        text: t ? tWithArgs(ErrorI18nKey.ForbiddenChars, { list: forbiddenNameSymbols.join(' ') }) : '',
      };
    }
  }

  return null;
};

export const getErrorForDisplayName = (name?: string, t?: (str: string) => string) => {
  const isWrongLength = isWrongFieldLength(name || '');
  const tWithArgs = t as (str: string, args?: Record<string, string | number>) => string;

  if (isWrongLength || !name) {
    return {
      type: ErrorType.LENGTH,
      text: t ? tWithArgs(ErrorI18nKey.MinMaxLength, { min: MIN_NAME_SYMBOLS, max: MAX_NAME_SYMBOLS }) : '',
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

export const hasInvalidCharacters = (value?: string): boolean => {
  if (!value) return false;

  return forbiddenNameSymbols.some((symbol) => value.includes(symbol));
};

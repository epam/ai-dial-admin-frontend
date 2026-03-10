import { ErrorI18nKey } from '@/src/constants/i18n';
import {
  MAX_NAME_SYMBOLS,
  MAX_URL_ID_SYMBOLS,
  MIN_NAME_SYMBOLS,
  FORBIDDEN_NAME_SYMBOLS,
  MAX_DEPLOYMENT_ID_SYMBOLS,
} from '@/src/constants/validation';
import { ErrorType } from '@/src/types/error-type';
import { isValidHttpUrl } from './url-error';

export const getErrorForUrlId = (
  id?: string,
  names?: string[],
  t?: (str: string, param?: Record<string, number>) => string,
) => {
  const isIncludesName = id && names?.includes(id);
  if (isIncludesName) {
    return {
      type: ErrorType.EXISTING,
      text: t ? t(ErrorI18nKey.NameExists) : '',
    };
  }

  const isWrongId = id && !isValidHttpUrl(id);
  const isWrongLength = !id || id.length === 0 || id.length > MAX_URL_ID_SYMBOLS;
  if (isWrongId) {
    return {
      type: ErrorType.INVALID,
      text: t ? t(ErrorI18nKey.UrlField) : '',
    };
  }
  if (isWrongLength) {
    return {
      type: ErrorType.LENGTH,
      text: t ? t(ErrorI18nKey.Length, { number: MAX_URL_ID_SYMBOLS }) : '',
    };
  }
  return null;
};

export const getErrorForName = (
  name?: string,
  names?: string[],
  t?: (str: string) => string,
  isUniqueNameError?: boolean,
  checkForbiddenChars = true,
  isDisplayName = false,
  isDeploymentId = false,
  checkEmptySymbols = true,
) => {
  const isIncludesName = name && names?.includes(name);
  if (isIncludesName || isUniqueNameError) {
    return {
      type: ErrorType.EXISTING,
      text: t ? t(isDisplayName ? ErrorI18nKey.DisplayNameExists : ErrorI18nKey.NameExists) : '',
    };
  }

  const tWithArgs = t as (str: string, args?: Record<string, string | number>) => string;
  const isWrongLength = isWrongFieldLength(name || '', isDeploymentId);
  if (isWrongLength) {
    return {
      type: ErrorType.LENGTH,
      text: t
        ? tWithArgs(ErrorI18nKey.MinMaxLength, {
            min: MIN_NAME_SYMBOLS,
            max: isDeploymentId ? MAX_DEPLOYMENT_ID_SYMBOLS : MAX_NAME_SYMBOLS,
          })
        : '',
    };
  }

  if (checkForbiddenChars) {
    if (isDeploymentId) {
      if (!name?.match(/^[a-z0-9-]+$/)) {
        return {
          type: ErrorType.INVALID,
          text: t ? tWithArgs(ErrorI18nKey.ContainerId) : '',
        };
      }
    }
    const hasForbiddenChars = hasInvalidCharacters(name);
    if (hasForbiddenChars) {
      return {
        type: ErrorType.FORBIDDEN_CHARS,
        text: t ? tWithArgs(ErrorI18nKey.ForbiddenChars, { list: FORBIDDEN_NAME_SYMBOLS.join(' ') }) : '',
      };
    }
    if (checkEmptySymbols && name?.includes(' ')) {
      return {
        type: ErrorType.INVALID,
        text: t ? t(ErrorI18nKey.ContainSpace) : '',
      };
    }
  }

  return null;
};

export const getErrorForDisplayName = (name?: string, required?: boolean, t?: (str: string) => string) => {
  const isWrongLength = !name && !required ? false : isWrongFieldLength(name || '');
  const tWithArgs = t as (str: string, args?: Record<string, string | number>) => string;

  if (isWrongLength || (!name && required)) {
    return {
      type: ErrorType.LENGTH,
      text: t ? tWithArgs(ErrorI18nKey.MinMaxLength, { min: MIN_NAME_SYMBOLS, max: MAX_NAME_SYMBOLS }) : '',
    };
  }
  return null;
};

export const isWrongFieldLength = (value: string, isDeploymentId?: boolean): boolean => {
  return (
    value.length < MIN_NAME_SYMBOLS || value.length > (isDeploymentId ? MAX_DEPLOYMENT_ID_SYMBOLS : MAX_NAME_SYMBOLS)
  );
};

export const hasInvalidCharacters = (value?: string): boolean => {
  if (!value) return false;

  return FORBIDDEN_NAME_SYMBOLS.some((symbol) => value.includes(symbol));
};

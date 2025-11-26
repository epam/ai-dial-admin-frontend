import { ErrorI18nKey } from '@/src/constants/i18n';
import { ErrorType } from '@/src/types/error-type';

const META_SYMBOLS_REGEX = /.*[[\]()^$|{}\\].*/;
const PATH_REGEX = /^\/?(?!.*\/\/)[\w\-./]*$/;

export const isContainRegexSymbols = (path: string): boolean => {
  return META_SYMBOLS_REGEX.test(path) || path.includes('*') || path.includes('?') || path.includes('+');
};

export const isValidUrlPath = (urlPath: string): boolean => {
  if (urlPath === '') {
    return false;
  }

  let path = urlPath;
  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  return PATH_REGEX.test(path);
};

export const isValidRoutePath = (path: string): boolean => {
  if (path === '') {
    return true;
  }
  if (isContainRegexSymbols(path)) {
    try {
      new RegExp(path);
      return true;
    } catch {
      return false;
    }
  }
  return isValidUrlPath(path);
};

export const isValidPaths = (paths: string[]): boolean => {
  const validPaths = paths.filter((path) => !!getErrorForPath(path));
  return !(validPaths.length === 0);
};

export const getErrorForPath = (path?: string, t?: (str: string) => string) => {
  const isEmptyPath = !path || path === '';
  const isInvalid = path && !isValidRoutePath(path);

  if (isEmptyPath) {
    return {
      type: ErrorType.EMPTY,
      text: t ? t(ErrorI18nKey.RequiredProperty) : '',
    };
  }
  if (isInvalid) {
    return {
      type: ErrorType.INVALID,
      text: t ? t(ErrorI18nKey.InvalidPath) : '',
    };
  }

  return null;
};

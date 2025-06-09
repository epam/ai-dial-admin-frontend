import { RoutesI18nKey } from '@/src/constants/i18n';
import { ErrorType } from '@/src/types/error-type';

const PATH_REGEX = /^\/(?=.{1,})([a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*\/?)?$/;

export const isValidRoutePath = (path: string): boolean => {
  return path === '' ? true : PATH_REGEX.test(path);
};

export const isValidAllRoutePaths = (paths: string[]): boolean => {
  const nonEmptyValues = paths.filter((path) => path !== '');

  if (nonEmptyValues.length === 0) {
    return false;
  }

  return nonEmptyValues.every((path) => PATH_REGEX.test(path));
};

export const getErrorForPath = (path?: string, t?: (str: string) => string) => {
  const isEmptyPath = !path || path === '';
  const isInvalid = path && !PATH_REGEX.test(path);

  if (isEmptyPath) {
    return {
      type: ErrorType.EMPTY,
      text: t ? t(RoutesI18nKey.RequiredProperty) : '',
    };
  }
  if (isInvalid) {
    return {
      type: ErrorType.INVALID,
      text: t ? t(RoutesI18nKey.InvalidPath) : '',
    };
  }

  return null;
};

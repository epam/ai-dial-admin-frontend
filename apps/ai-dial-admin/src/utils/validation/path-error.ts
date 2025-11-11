import { ErrorI18nKey } from '@/src/constants/i18n';
import { ErrorType } from '@/src/types/error-type';
import { describe, it, expect } from 'vitest';

// todo when correct regexp will be found return all validation
// const PATH_REGEX = /^\/(?=.{1,})([a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*\/?)?$/;

export const isValidRoutePath = (_path: string): boolean => {
  return true;
  // return path === '' ? true : PATH_REGEX.test(path);
};

export const isValidPaths = (paths: string[]): boolean => {
  const validPaths = paths.filter((path) => !!getErrorForPath(path));
  return !(validPaths.length === 0);
};

export const getErrorForPath = (path?: string, t?: (str: string) => string) => {
  const isEmptyPath = !path || path === '';
  // const isInvalid = path && !PATH_REGEX.test(path);

  if (isEmptyPath) {
    return {
      type: ErrorType.EMPTY,
      text: t ? t(ErrorI18nKey.RequiredProperty) : '',
    };
  }
  // if (isInvalid) {
  //   return {
  //     type: ErrorType.INVALID,
  //     text: t ? t(ErrorI18nKey.InvalidPath) : '',
  //   };
  // }

  return null;
};

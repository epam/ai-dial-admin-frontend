import { ErrorI18nKey } from '@/src/constants/i18n';
import { ErrorType } from '@/src/types/error-type';

const META_SYMBOLS_REGEX = /.*[()[\]{}*+?.^$|\\].*/;
const PLAIN_PATH_PATTERN = /^\/[a-zA-Z0-9_\-./]+$/;
export const MAX_LENGTH = 4096;

export const isContainRegexSymbols = (path: string): boolean => {
  return META_SYMBOLS_REGEX.test(path);
};

export const areBracketsBalanced = (pattern: string): boolean => {
  const stack = [];

  for (let i = 0; i < pattern.length; i++) {
    let c = pattern[i];

    // Skip escaped characters
    if (c === '\\' && i + 1 < pattern.length) {
      i++; // Skip the next character as it's escaped
      continue;
    }

    // Handle opening brackets
    if (c === '(' || c === '[' || c === '{') {
      stack.push(c);
    } else if (c === ')') {
      // Handle closing brackets
      if (stack.length === 0 || stack.pop() !== '(') {
        return false;
      }
    } else if (c === ']') {
      if (stack.length === 0 || stack.pop() !== '[') {
        return false;
      }
    } else if (c === '}') {
      if (stack.length === 0 || stack.pop() !== '{') {
        return false;
      }
    }
  }

  return stack.length === 0;
};

export const validateRegexPattern = (pattern: string): boolean => {
  // Must start with / or ^/ or ^/+ for HTTP paths
  // ^/+ means ^ followed by one or more /, so ^/ covers the minimum case
  if (!pattern.startsWith('/') && !pattern.startsWith('^/')) {
    return false;
  }

  // Check balanced brackets: (), [], {}
  if (!areBracketsBalanced(pattern)) {
    return false;
  }

  // Must compile as valid JavaScript regex
  try {
    new RegExp(pattern); // Validate if the pattern is a valid regex
    return true;
  } catch {
    return false;
  }
};

export const validatePlainPath = (path: string): boolean => {
  // Must start with /
  if (!path.startsWith('/')) {
    return false;
  }

  // Root path / is valid
  if (path === '/') {
    return true;
  }

  // No consecutive slashes
  if (path.includes('//')) {
    return false;
  }

  // Check pattern: only letters, digits, hyphens, underscores, dots, and slashes
  if (!PLAIN_PATH_PATTERN.test(path)) {
    return false;
  }

  return true;
};

export const isValidRoutePath = (path: string): boolean => {
  if (path === '') {
    return true;
  }
  if (path.length > MAX_LENGTH) {
    return false;
  }
  if (isContainRegexSymbols(path)) {
    return validateRegexPattern(path);
  }
  return validatePlainPath(path);
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

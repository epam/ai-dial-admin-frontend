import { describe, expect, test, vi } from 'vitest';
import { ErrorType } from '@/src/types/error-type';
import {
  getErrorForPath,
  isContainRegexSymbols,
  isValidRoutePath,
  areBracketsBalanced,
  validateRegexPattern,
  validatePlainPath,
  MAX_LENGTH,
} from '../path-error';

describe('isContainRegexSymbols', () => {
  test('should return true for string with regex metacharacters', () => {
    expect(isContainRegexSymbols('[a-z]')).toBe(true);
    expect(isContainRegexSymbols('foo*bar')).toBe(true);
    expect(isContainRegexSymbols('foo+bar')).toBe(true);
    expect(isContainRegexSymbols('foo?bar')).toBe(true);
    expect(isContainRegexSymbols('(foo|bar)')).toBe(true);
    expect(isContainRegexSymbols('foo[bar]')).toBe(true);
    expect(isContainRegexSymbols('foo$bar')).toBe(true);
    expect(isContainRegexSymbols('foo{bar}')).toBe(true);
    expect(isContainRegexSymbols('foo\\bar')).toBe(true);
  });

  test('should return false for string without regex metacharacters', () => {
    expect(isContainRegexSymbols('simple/path')).toBe(false);
    expect(isContainRegexSymbols('file123')).toBe(false);
    expect(isContainRegexSymbols('hello-world')).toBe(false);
  });

  test('should return true for strings containing wildcard characters', () => {
    expect(isContainRegexSymbols('*wildcard*')).toBe(true);
    expect(isContainRegexSymbols('foo?bar')).toBe(true);
    expect(isContainRegexSymbols('foo+bar')).toBe(true);
  });

  test('should return false for an empty string', () => {
    expect(isContainRegexSymbols('')).toBe(false);
  });

  test('should return false for a string with only spaces', () => {
    expect(isContainRegexSymbols('     ')).toBe(false);
  });

  test('should return false for string with characters that are not metacharacters', () => {
    expect(isContainRegexSymbols('path/to/resource')).toBe(false);
    expect(isContainRegexSymbols('file_name123')).toBe(false);
  });
});

describe('areBracketsBalanced', () => {
  test('should return true for an empty string', () => {
    expect(areBracketsBalanced('')).toBe(true);
  });

  test('should return true for balanced brackets', () => {
    expect(areBracketsBalanced('()')).toBe(true);
    expect(areBracketsBalanced('{}[]()')).toBe(true);
    expect(areBracketsBalanced('({[]})')).toBe(true);
  });

  test('should return false for unbalanced brackets', () => {
    expect(areBracketsBalanced('(')).toBe(false);
    expect(areBracketsBalanced('([)]')).toBe(false);
    expect(areBracketsBalanced('({[})')).toBe(false);
    expect(areBracketsBalanced(')(')).toBe(false);
    expect(areBracketsBalanced('[](')).toBe(false);
  });

  test('should ignore escaped characters and return true for balanced brackets', () => {
    expect(areBracketsBalanced('\\(')).toBe(true);
    expect(areBracketsBalanced('()\\(')).toBe(true);
    expect(areBracketsBalanced('({\\[})')).toBe(true);
  });

  test('should return false for unbalanced brackets with escaped characters', () => {
    expect(areBracketsBalanced('([\\])')).toBe(false);
  });

  test('should return true for balanced brackets with mixed types', () => {
    expect(areBracketsBalanced('{[()]}')).toBe(true);
    expect(areBracketsBalanced('({[()()]})')).toBe(true);
  });

  test('should return false when there are extra closing brackets', () => {
    expect(areBracketsBalanced('([{}))')).toBe(false);
    expect(areBracketsBalanced('{[}')).toBe(false);
  });

  test('should return false when there are extra opening brackets', () => {
    expect(areBracketsBalanced('(((')).toBe(false);
    expect(areBracketsBalanced('[{')).toBe(false);
  });
});

describe('validateRegexPattern', () => {
  test('should return true for valid patterns starting with / or ^/', () => {
    expect(validateRegexPattern('/abc/')).toBe(true);
    expect(validateRegexPattern('^/path/to/resource')).toBe(true);
    expect(validateRegexPattern('^/user/\\d+/profile')).toBe(true);
  });

  test('should return false for patterns that don’t start with / or ^/', () => {
    expect(validateRegexPattern('abc/')).toBe(false);
    expect(validateRegexPattern('user/profile')).toBe(false);
    expect(validateRegexPattern('^user/profile')).toBe(false);
  });

  test('should return false for unbalanced brackets', () => {
    expect(validateRegexPattern('/[abc/')).toBe(false);
    expect(validateRegexPattern('/(abc')).toBe(false);
    expect(validateRegexPattern('/{abc')).toBe(false);
  });

  test('should return false for invalid regex patterns', () => {
    expect(validateRegexPattern('/abc[')).toBe(false);
    expect(validateRegexPattern('/^+*/')).toBe(false);
    expect(validateRegexPattern('/\\d+[')).toBe(false);
  });

  test('should return false for empty pattern', () => {
    expect(validateRegexPattern('')).toBe(false);
  });
});

describe('validatePlainPath', () => {
  test('should return true for a root path', () => {
    expect(validatePlainPath('/')).toBe(true);
  });

  test('should return true for valid paths with allowed characters', () => {
    expect(validatePlainPath('/user/profile')).toBe(true);
    expect(validatePlainPath('/user_profile/123')).toBe(true);
    expect(validatePlainPath('/abc/def-ghi/xyz.123')).toBe(true);
  });

  test('should return false for paths that don’t start with /', () => {
    expect(validatePlainPath('user/profile')).toBe(false);
  });

  test('should return false for paths with consecutive slashes', () => {
    expect(validatePlainPath('/user//profile')).toBe(false);
  });

  test('should return false for paths with invalid characters', () => {
    expect(validatePlainPath('/user|profile')).toBe(false);
    expect(validatePlainPath('/user@profile')).toBe(false);
    expect(validatePlainPath('/user#profile')).toBe(false);
    expect(validatePlainPath('/user profile')).toBe(false);
  });

  test('should return false for empty path', () => {
    expect(validatePlainPath('')).toBe(false);
  });

  test('should return false for paths with only slashes', () => {
    expect(validatePlainPath('///')).toBe(false);
  });

  test('should return true for a path with a dot', () => {
    expect(validatePlainPath('/file.txt')).toBe(true);
  });

  test('should return false for a path with spaces', () => {
    expect(validatePlainPath('/user name/profile')).toBe(false);
  });
});

describe('isValidRoutePath', () => {
  test('should return true for an empty path', () => {
    expect(isValidRoutePath('')).toBe(true);
  });

  test('should return false for paths exceeding the maximum length', () => {
    const longPath = 'a'.repeat(MAX_LENGTH + 1);
    expect(isValidRoutePath(longPath)).toBe(false);
  });

  test('should return true for valid regex paths', () => {
    expect(isValidRoutePath('/abc/*')).toBe(true);
    expect(isValidRoutePath('/user/\\d+/profile')).toBe(true);
  });

  test('should return false for invalid regex patterns', () => {
    expect(isValidRoutePath('/abc[')).toBe(false);
    expect(isValidRoutePath('/^+*/')).toBe(false);
  });

  test('should return true for valid plain paths', () => {
    expect(isValidRoutePath('/user/profile')).toBe(true);
    expect(isValidRoutePath('/abc/def-ghi/xyz.123')).toBe(true);
  });

  test('should return false for invalid plain paths', () => {
    expect(isValidRoutePath('/user>profile')).toBe(false);
    expect(isValidRoutePath('/user@profile')).toBe(false);
    expect(isValidRoutePath('/user profile')).toBe(false);
  });

  test('should return true for valid plain paths with letters, digits, hyphens, and slashes', () => {
    expect(isValidRoutePath('/user/123-profile')).toBe(true);
    expect(isValidRoutePath('/home/abc/xyz')).toBe(true);
  });
});

describe('getErrorForPath', () => {
  const mockT = vi.fn().mockReturnValue('Translated Text');

  test('Should return empty error when path is undefined', () => {
    const res = getErrorForPath(undefined, mockT);
    expect(res).toEqual({
      type: ErrorType.EMPTY,
      text: 'Translated Text',
    });
  });

  test('Should return empty error when path is empty string', () => {
    const res = getErrorForPath('', mockT);
    expect(res).toEqual({
      type: ErrorType.EMPTY,
      text: 'Translated Text',
    });
  });

  test('Should return empty error without translator function', () => {
    const res = getErrorForPath('');
    expect(res).toEqual({
      type: ErrorType.EMPTY,
      text: '',
    });
  });

  test('Should return invalid error when path does not match regex', () => {
    const invalidPath = 'invalid path with spaces';
    const res = getErrorForPath(invalidPath, mockT);
    expect(res).toEqual({
      type: ErrorType.INVALID,
      text: 'Translated Text',
    });
  });

  test('Should return invalid error without translator function', () => {
    const invalidPath = 'invalid path with spaces';
    const res = getErrorForPath(invalidPath);
    expect(res).toEqual({
      type: ErrorType.INVALID,
      text: '',
    });
  });

  test('Should return null for valid path', () => {
    const validPath = '/valid-path_123';
    const res = getErrorForPath(validPath, mockT);
    expect(res).toBeNull();
  });

  test('Should return null for valid path without translator', () => {
    const validPath = '/valid-path_123';
    const res = getErrorForPath(validPath);
    expect(res).toBeNull();
  });
});

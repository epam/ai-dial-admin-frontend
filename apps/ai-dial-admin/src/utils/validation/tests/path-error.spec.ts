import { describe, expect, test, vi } from 'vitest';
import { ErrorType } from '@/src/types/error-type';
import { getErrorForPath, isValidPaths, isContainRegexSymbols, isValidUrlPath, isValidRoutePath } from '../path-error';

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

describe('isValidUrlPath', () => {
  test('should return false for an empty string', () => {
    expect(isValidUrlPath('')).toBe(false);
  });

  test('should return true for valid URL paths', () => {
    expect(isValidUrlPath('/valid/path')).toBe(true);
    expect(isValidUrlPath('valid/path')).toBe(true);
    expect(isValidUrlPath('/my-resource')).toBe(true);
    expect(isValidUrlPath('/folder/1')).toBe(true);
  });

  test('should return false for invalid URL paths', () => {
    expect(isValidUrlPath('invalid|path')).toBe(false);
    expect(isValidUrlPath('/invalid$path')).toBe(false);
    expect(isValidUrlPath('/path/with space')).toBe(false);
    expect(isValidUrlPath('/path//double-slash')).toBe(false);
  });

  test('should add a leading slash to paths without one', () => {
    expect(isValidUrlPath('validPathWithoutSlash')).toBe(true);
    expect(isValidUrlPath('my-resource')).toBe(true);
  });

  test('should return false for paths with special characters that are invalid', () => {
    expect(isValidUrlPath('/foo@bar')).toBe(false);
    expect(isValidUrlPath('/foo&bar')).toBe(false);
  });

  test('should return true for valid paths with common characters', () => {
    expect(isValidUrlPath('/user/profile')).toBe(true);
    expect(isValidUrlPath('/file-name')).toBe(true);
    expect(isValidUrlPath('/folder1/subfolder2')).toBe(true);
  });
});

describe('isValidRoutePath', () => {
  test('should return true for an empty string', () => {
    expect(isValidRoutePath('')).toBe(true);
  });

  test('should return true for a valid regex pattern', () => {
    expect(isValidRoutePath('[a-z]+')).toBe(true);
    expect(isValidRoutePath('foo*bar')).toBe(true);
  });

  test('should return false for an invalid regex pattern', () => {
    expect(isValidRoutePath('(foo|bar')).toBe(false);
  });

  test('should return false for a string with regex symbols that is not a valid regex', () => {
    expect(isValidRoutePath('[a-z')).toBe(false);
  });

  test('should return true for valid URL paths', () => {
    expect(isValidRoutePath('/valid/path')).toBe(true);
    expect(isValidRoutePath('valid/path')).toBe(true);
    expect(isValidRoutePath('/my-resource')).toBe(true);
    expect(isValidRoutePath('/folder/1')).toBe(true);
  });

  test('should return true for valid non-regex, non-URL paths', () => {
    expect(isValidRoutePath('/home')).toBe(true);
    expect(isValidRoutePath('/about-us')).toBe(true);
    expect(isValidRoutePath('my-resource')).toBe(true);
  });

  test('should return true for an empty path', () => {
    expect(isValidRoutePath('')).toBe(true);
  });

  test('should return true for a valid path with a leading slash', () => {
    expect(isValidRoutePath('/path/to/resource')).toBe(true);
  });

  test('should return true for valid paths without a leading slash', () => {
    expect(isValidRoutePath('path/to/resource')).toBe(true);
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

describe('isValidPaths', () => {
  test('should return false for empty array', () => {
    expect(isValidPaths([])).toBe(false);
  });

  test('should return false if all paths are valid', () => {
    expect(isValidPaths(['validPath'])).toBe(false);
  });

  test('should return true if any path is invalid', () => {
    expect(isValidPaths([''])).toBe(true);
    expect(isValidPaths(['validPath', ''])).toBe(true);
  });
});

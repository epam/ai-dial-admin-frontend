import { describe, expect, test } from 'vitest';
import { ErrorType } from '@/src/types/error-type';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { isDangerEndpoint, isValidEndpoint, isValidHttpUrl, getUrlError } from '../url-error';

describe('isValidHttpUrl', () => {
  test('returns true for valid http and https URLs', () => {
    expect(isValidHttpUrl('http://example.com')).toBe(true);
    expect(isValidHttpUrl('https://example.com')).toBe(true);
    expect(isValidHttpUrl('https://sub.domain.com/path?query=1')).toBe(true);
  });

  test('returns false for invalid URLs', () => {
    expect(isValidHttpUrl('https:/sub.domain.com/path?query=1')).toBe(false);
    expect(isValidHttpUrl('https:sub.domain.com/path?query=1')).toBe(false);
    expect(isValidHttpUrl('http:/example.com')).toBe(false);
    expect(isValidHttpUrl('http:example.com')).toBe(false);
    expect(isValidHttpUrl('ftp://example.com')).toBe(false);
    expect(isValidHttpUrl('not-a-url')).toBe(false);
    expect(isValidHttpUrl('')).toBe(false);
  });
});

describe('isValidEndpoint', () => {
  test('returns true for valid endpoints', () => {
    expect(isValidEndpoint('http://example.com')).toBe(true);
    expect(isValidEndpoint('https://example.com')).toBe(true);
    expect(isValidEndpoint('https://sub.domain.com/path?query=1')).toBe(true);
    expect(isValidEndpoint('http://example-url-backend:50/')).toBe(true);
    expect(isValidEndpoint('http://localhost')).toBe(true);
    expect(isValidEndpoint('http://localhost:3000/path')).toBe(true);
  });

  test('returns false for invalid endpoints', () => {
    expect(isValidEndpoint('ftp://example.com')).toBe(false);
    expect(isValidEndpoint('not-a-url')).toBe(false);
    expect(isValidEndpoint('')).toBe(false);
    expect(isValidEndpoint('http:/example.com')).toBe(false);
  });
});

describe('isDangerEndpoint', () => {
  test('returns true for http endpoints', () => {
    expect(isDangerEndpoint('http://example.com')).toBe(true);
    expect(isDangerEndpoint('http://sub.domain.com')).toBe(true);
  });

  test('returns false for https and other endpoints', () => {
    expect(isDangerEndpoint('https://example.com')).toBe(false);
    expect(isDangerEndpoint('ftp://example.com')).toBe(false);
    expect(isDangerEndpoint('')).toBe(false);
  });
});

describe('getUrlError', () => {
  const t = (str: string) => str;

  test('returns an error for required url', () => {
    const error = getUrlError(void 0, t, true);

    expect(error?.type).toEqual(ErrorType.EMPTY);
    expect(error?.text).toEqual(ErrorI18nKey.RequiredField);
  });

  test('returns an error for required url  without t', () => {
    const error = getUrlError(void 0, void 0, true);

    expect(error?.type).toEqual(ErrorType.EMPTY);
    expect(error?.text).toEqual('');
  });

  test('returns an error for invalid url', () => {
    const url = 'invalid-url';

    const error = getUrlError(url, t);

    expect(error?.type).toEqual(ErrorType.INVALID);
    expect(error?.text).toEqual(ErrorI18nKey.UrlField);
  });

  test('returns an error for invalid url without t', () => {
    const url = 'invalid-url';

    const error = getUrlError(url);

    expect(error?.type).toEqual(ErrorType.INVALID);
    expect(error?.text).toEqual('');
  });

  test('returns null for valid url', () => {
    const url = 'https://example.com';
    const t = (str: string) => str;
    const error = getUrlError(url, t);

    expect(error).toBeNull();
  });
});

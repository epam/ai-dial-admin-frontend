import { describe, expect, test, vi } from 'vitest';

import { ErrorI18nKey } from '@/src/constants/i18n';
import { ErrorType } from '@/src/types/error-type';
import { getErrorForApiKeyHeader, getErrorForClientId, getErrorForClientSecret } from '../toolset-auth-error';

const mockT = vi.fn().mockReturnValue('Translated Text');

describe('getErrorForClientId', () => {
  test('returns EMPTY error for empty string', () => {
    const result1 = getErrorForClientId('', mockT);
    const result2 = getErrorForClientId('');

    expect(result1).toEqual({
      type: ErrorType.EMPTY,
      text: 'Translated Text',
    });

    expect(result2).toEqual({
      type: ErrorType.EMPTY,
      text: '',
    });
  });

  test('returns EMPTY error for whitespace-only string', () => {
    const result1 = getErrorForClientId('   ', mockT);
    const result2 = getErrorForClientId('  \t  ');
    const result3 = getErrorForClientId('\n\n');

    expect(result1).toEqual({
      type: ErrorType.EMPTY,
      text: 'Translated Text',
    });

    expect(result2).toEqual({
      type: ErrorType.EMPTY,
      text: '',
    });

    expect(result3).toEqual({
      type: ErrorType.EMPTY,
      text: '',
    });
  });

  test('returns EMPTY error for undefined', () => {
    const result1 = getErrorForClientId(undefined, mockT);
    const result2 = getErrorForClientId();

    expect(result1).toEqual({
      type: ErrorType.EMPTY,
      text: 'Translated Text',
    });

    expect(result2).toEqual({
      type: ErrorType.EMPTY,
      text: '',
    });
  });

  test('returns null for valid non-empty value', () => {
    const result1 = getErrorForClientId('valid-client-id', mockT);
    const result2 = getErrorForClientId('1234567890');
    const result3 = getErrorForClientId('uuid-123-456');

    expect(result1).toBeNull();
    expect(result2).toBeNull();
    expect(result3).toBeNull();
  });

  test('returns correct translation key when t is provided', () => {
    const t = (key: string) => key;
    const result = getErrorForClientId('', t);

    expect(result).toEqual({
      type: ErrorType.EMPTY,
      text: ErrorI18nKey.RequiredField,
    });
  });
});

describe('getErrorForClientSecret', () => {
  test('returns EMPTY error for empty string', () => {
    const result1 = getErrorForClientSecret('', mockT);
    const result2 = getErrorForClientSecret('');

    expect(result1).toEqual({
      type: ErrorType.EMPTY,
      text: 'Translated Text',
    });

    expect(result2).toEqual({
      type: ErrorType.EMPTY,
      text: '',
    });
  });

  test('returns EMPTY error for whitespace-only string', () => {
    const result1 = getErrorForClientSecret('   ', mockT);
    const result2 = getErrorForClientSecret('  \t  ');
    const result3 = getErrorForClientSecret('\n\n');

    expect(result1).toEqual({
      type: ErrorType.EMPTY,
      text: 'Translated Text',
    });

    expect(result2).toEqual({
      type: ErrorType.EMPTY,
      text: '',
    });

    expect(result3).toEqual({
      type: ErrorType.EMPTY,
      text: '',
    });
  });

  test('returns EMPTY error for undefined', () => {
    const result1 = getErrorForClientSecret(undefined, mockT);
    const result2 = getErrorForClientSecret();

    expect(result1).toEqual({
      type: ErrorType.EMPTY,
      text: 'Translated Text',
    });

    expect(result2).toEqual({
      type: ErrorType.EMPTY,
      text: '',
    });
  });

  test('returns null for valid non-empty value', () => {
    const result1 = getErrorForClientSecret('valid-secret-key', mockT);
    const result2 = getErrorForClientSecret('abcdef123456');
    const result3 = getErrorForClientSecret('super-secret-password');

    expect(result1).toBeNull();
    expect(result2).toBeNull();
    expect(result3).toBeNull();
  });

  test('returns correct translation key when t is provided', () => {
    const t = (key: string) => key;
    const result = getErrorForClientSecret('', t);

    expect(result).toEqual({
      type: ErrorType.EMPTY,
      text: ErrorI18nKey.RequiredField,
    });
  });
});

describe('getErrorForApiKeyHeader', () => {
  test('returns EMPTY error for empty string', () => {
    const result1 = getErrorForApiKeyHeader('', mockT);
    const result2 = getErrorForApiKeyHeader('');

    expect(result1).toEqual({
      type: ErrorType.EMPTY,
      text: 'Translated Text',
    });

    expect(result2).toEqual({
      type: ErrorType.EMPTY,
      text: '',
    });
  });

  test('returns EMPTY error for whitespace-only string', () => {
    const result1 = getErrorForApiKeyHeader('   ', mockT);
    const result2 = getErrorForApiKeyHeader('  \t  ');
    const result3 = getErrorForApiKeyHeader('\n\n');

    expect(result1).toEqual({
      type: ErrorType.EMPTY,
      text: 'Translated Text',
    });

    expect(result2).toEqual({
      type: ErrorType.EMPTY,
      text: '',
    });

    expect(result3).toEqual({
      type: ErrorType.EMPTY,
      text: '',
    });
  });

  test('returns EMPTY error for undefined', () => {
    const result1 = getErrorForApiKeyHeader(undefined, mockT);
    const result2 = getErrorForApiKeyHeader();

    expect(result1).toEqual({
      type: ErrorType.EMPTY,
      text: 'Translated Text',
    });

    expect(result2).toEqual({
      type: ErrorType.EMPTY,
      text: '',
    });
  });

  test('returns null for valid non-empty value', () => {
    const result1 = getErrorForApiKeyHeader('x-api-key', mockT);
    const result2 = getErrorForApiKeyHeader('Authorization');
    const result3 = getErrorForApiKeyHeader('X-Custom-Header');

    expect(result1).toBeNull();
    expect(result2).toBeNull();
    expect(result3).toBeNull();
  });

  test('returns correct translation key when t is provided', () => {
    const t = (key: string) => key;
    const result = getErrorForApiKeyHeader('', t);

    expect(result).toEqual({
      type: ErrorType.EMPTY,
      text: ErrorI18nKey.RequiredField,
    });
  });
});

describe('getErrorForClientSecret — minLength', () => {
  test('returns a LENGTH error for a non-empty value below the minimum', () => {
    expect(getErrorForClientSecret('1234567', (key) => key, 8)).toEqual({
      type: ErrorType.LENGTH,
      text: ErrorI18nKey.ClientSecretMinLength,
    });
  });

  test('passes the minimum to the translator', () => {
    const t = vi.fn().mockReturnValue('too short');

    getErrorForClientSecret('abc', t, 8);

    expect(t).toHaveBeenCalledWith(ErrorI18nKey.ClientSecretMinLength, { number: 8 });
  });

  test('returns null for a value at the minimum', () => {
    expect(getErrorForClientSecret('12345678', mockT, 8)).toBeNull();
  });

  test('keeps the required error for an empty value', () => {
    expect(getErrorForClientSecret('', (key) => key, 8)).toEqual({
      type: ErrorType.EMPTY,
      text: ErrorI18nKey.RequiredField,
    });
  });

  test('does not enforce a length when no minimum is given', () => {
    expect(getErrorForClientSecret('a', mockT)).toBeNull();
  });
});

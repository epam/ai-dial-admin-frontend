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

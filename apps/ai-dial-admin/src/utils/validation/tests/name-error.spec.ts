import { describe, expect, test, vi, beforeEach } from 'vitest';

import { ErrorI18nKey } from '@/src/constants/i18n';
import { FORBIDDEN_NAME_SYMBOLS } from '@/src/constants/validation';
import { ErrorType } from '@/src/types/error-type';
import { getErrorForDisplayName, getErrorForName, getErrorForUrlId, hasInvalidCharacters } from '../name-error';

const mockT = vi.fn().mockReturnValue('Translated Text');

describe('getErrorForUrlId', () => {
  const t = (s: string) => s;
  test('Should return invalid error', () => {
    const res1 = getErrorForUrlId('id', []);
    const res2 = getErrorForUrlId('id', [], t);
    const res3 = getErrorForUrlId('', [], t);
    const res4 = getErrorForUrlId(void 0, [], t);

    expect(res1).toEqual({
      text: '',
      type: ErrorType.INVALID,
    });

    expect(res2).toEqual({
      text: ErrorI18nKey.UrlField,
      type: ErrorType.INVALID,
    });

    expect(res3).toEqual({
      text: ErrorI18nKey.Length,
      type: ErrorType.LENGTH,
    });

    expect(res4).toEqual({
      text: ErrorI18nKey.Length,
      type: ErrorType.LENGTH,
    });
  });

  test('Should return length error', () => {
    const res1 = getErrorForUrlId(`https://ai-dial-test.com${new Array(851).fill('a').join()}`, []);
    const res2 = getErrorForUrlId(`https://ai-dial-test.com${new Array(851).fill('a').join()}`, [], t);

    expect(res1).toEqual({
      text: '',
      type: ErrorType.LENGTH,
    });
    expect(res2).toEqual({
      text: ErrorI18nKey.Length,
      type: ErrorType.LENGTH,
    });
  });

  test('Should return null', () => {
    const res = getErrorForUrlId('https://ai-dial-test.com');

    expect(res).toBeNull();
  });

  test('Should return EXISTING error', () => {
    const res1 = getErrorForUrlId(`id`, ['id']);
    const res2 = getErrorForUrlId(`id`, ['id'], t);

    expect(res1).toEqual({
      text: '',
      type: ErrorType.EXISTING,
    });
    expect(res2).toEqual({
      text: ErrorI18nKey.NameExists,
      type: ErrorType.EXISTING,
    });
  });
});

describe('getErrorForName', () => {
  const mockT = vi.fn().mockReturnValue('Translated Text');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Should return translated error for existing name', () => {
    const res1 = getErrorForName('name', ['name'], mockT);
    const res2 = getErrorForName('name', ['name']);

    expect(res1).toEqual({
      type: ErrorType.EXISTING,
      text: 'Translated Text',
    });

    expect(res2).toEqual({
      type: ErrorType.EXISTING,
      text: '',
    });
  });

  test('Should return length error for short name', () => {
    const res = getErrorForName('', ['name'], mockT);

    expect(res).toEqual({
      type: ErrorType.LENGTH,
      text: 'Translated Text',
    });
  });

  test('Should return empty error for undefined name', () => {
    const res1 = getErrorForName('n', ['name']);
    const res2 = getErrorForName(void 0, ['name']);

    expect(res1).toEqual({
      type: ErrorType.LENGTH,
      text: '',
    });

    expect(res2).toEqual({
      type: ErrorType.LENGTH,
      text: '',
    });
  });

  test('Should return length error for empty string', () => {
    const res1 = getErrorForName('', ['name'], mockT);
    const res2 = getErrorForName('', ['name']);

    expect(res1).toEqual({
      type: ErrorType.LENGTH,
      text: 'Translated Text',
    });

    expect(res2).toEqual({
      type: ErrorType.LENGTH,
      text: '',
    });
  });

  test('Should return length error for name exceeding max length', () => {
    const longName = 'a'.repeat(300);
    const res1 = getErrorForName(longName, ['name'], mockT);
    const res2 = getErrorForName(longName, ['name']);

    expect(res1).toEqual({
      type: ErrorType.LENGTH,
      text: 'Translated Text',
    });

    expect(res2).toEqual({
      type: ErrorType.LENGTH,
      text: '',
    });
  });

  test('Should return null for valid unique name', () => {
    const res = getErrorForName('name', ['names'], mockT);

    expect(res).toBeNull();
  });

  test('Should return null for name at minimum length boundary (2 chars)', () => {
    const res = getErrorForName('ab', ['names'], mockT);

    expect(res).toBeNull();
  });

  test('Should return null for name at maximum length boundary (255 chars)', () => {
    const maxLengthName = 'a'.repeat(255);
    const res = getErrorForName(maxLengthName, ['names'], mockT);

    expect(res).toBeNull();
  });

  test('Should return translated error for not unique name', () => {
    const res1 = getErrorForName('names', ['names'], mockT, true);
    const res2 = getErrorForName('names', ['names'], void 0, true);

    expect(res1).toEqual({
      type: ErrorType.EXISTING,
      text: 'Translated Text',
    });

    expect(res2).toEqual({
      type: ErrorType.EXISTING,
      text: '',
    });
  });

  test('Should handle multiple existing names in array', () => {
    const res = getErrorForName('name2', ['name1', 'name2', 'name3'], mockT, true);

    expect(res).toEqual({
      type: ErrorType.EXISTING,
      text: 'Translated Text',
    });
  });

  FORBIDDEN_NAME_SYMBOLS.forEach((symbol) => {
    test(`Should return forbidden chars error for symbol: ${symbol}`, () => {
      const nameWithSymbol = `name${symbol}`;
      const res1 = getErrorForName(nameWithSymbol, ['names'], mockT);
      const res2 = getErrorForName(nameWithSymbol, ['names']);

      expect(res1).toEqual({
        type: ErrorType.FORBIDDEN_CHARS,
        text: 'Translated Text',
      });

      expect(res2).toEqual({
        type: ErrorType.FORBIDDEN_CHARS,
        text: '',
      });
    });
  });

  test('Should detect forbidden symbols when checkForbiddenChars is true', () => {
    const nameWithForbiddenSymbol = 'name%';
    const res1 = getErrorForName(nameWithForbiddenSymbol, ['names'], mockT, false, true);
    const res2 = getErrorForName(nameWithForbiddenSymbol, ['names'], undefined, false, true);

    expect(res1).toEqual({
      type: ErrorType.FORBIDDEN_CHARS,
      text: 'Translated Text',
    });
    expect(res2).toEqual({
      type: ErrorType.FORBIDDEN_CHARS,
      text: '',
    });
  });

  test('Should not check forbidden symbols when checkForbiddenChars is false', () => {
    const nameWithForbiddenSymbol = 'name%';
    const res = getErrorForName(nameWithForbiddenSymbol, ['names'], mockT, false, false);

    expect(res).toBeNull();
  });

  test('Should return translated error for not unique display name', () => {
    const res1 = getErrorForName('displayName', ['displayName'], mockT, true, true, true);
    const res2 = getErrorForName('displayName', ['displayName'], undefined, true, true, true);

    expect(res1).toEqual({
      type: ErrorType.EXISTING,
      text: 'Translated Text',
    });

    expect(res2).toEqual({
      type: ErrorType.EXISTING,
      text: '',
    });
  });

  test('Should return INVALID error for name with space', () => {
    const res1 = getErrorForName('name with space', ['names'], mockT);
    const res2 = getErrorForName('name with space', ['names']);

    expect(res1).toEqual({
      type: ErrorType.INVALID,
      text: 'Translated Text',
    });

    expect(res2).toEqual({
      type: ErrorType.INVALID,
      text: '',
    });
  });

  test('Should return INVALID error for deployment id with invalid chars', () => {
    const res1 = getErrorForName('test_id', [], mockT, false, true, false, true);
    const res2 = getErrorForName('test_id', [], undefined, false, true, false, true);

    expect(res1).toEqual({
      type: ErrorType.INVALID,
      text: 'Translated Text',
    });

    expect(res2).toEqual({
      type: ErrorType.INVALID,
      text: '',
    });
  });

  test('Should allow valid deployment id characters', () => {
    const res = getErrorForName('test-id-123', [], mockT, false, true, false, true);

    expect(res).toBeNull();
  });

  test('Should handle all parameters set to false', () => {
    const res = getErrorForName('validname', ['other'], mockT, false, false, false, false);

    expect(res).toBeNull();
  });

  test('Should prioritize length error over forbidden chars error', () => {
    const res = getErrorForName('n%', ['names'], mockT);

    expect(res).toEqual({
      type: ErrorType.FORBIDDEN_CHARS,
      text: 'Translated Text',
    });
  });

  test('Should prioritize existing error over forbidden chars error', () => {
    const res = getErrorForName('name%', ['name%'], mockT, true);

    expect(res).toEqual({
      type: ErrorType.EXISTING,
      text: 'Translated Text',
    });
  });
});

describe('getErrorForDisplayName', () => {
  test('returns error if name is undefined', () => {
    const result = getErrorForDisplayName(undefined);

    expect(result).toBeNull();
  });

  test('returns error if name is too long', () => {
    const longName = 'a'.repeat(300);
    const result = getErrorForDisplayName(longName, false, mockT);
    expect(result).toEqual({
      type: ErrorType.LENGTH,
      text: 'Translated Text',
    });
  });

  test('returns error if required and name is empty', () => {
    const result = getErrorForDisplayName('', true, mockT);
    expect(result).toMatchObject({
      type: ErrorType.LENGTH,
      text: 'Translated Text',
    });
  });

  test('returns null if name is valid and required', () => {
    expect(getErrorForDisplayName('abc', true, mockT)).toBeNull();
    expect(getErrorForDisplayName('abcdef', true, mockT)).toBeNull();
  });

  test('returns null if name is valid and not required', () => {
    const validName = 'validName';
    const result = getErrorForDisplayName(validName, false, mockT);
    expect(result).toBeNull();
  });
});

describe('hasInvalidCharacters', () => {
  test('returns false if value is n void 0', () => {
    expect(hasInvalidCharacters()).toBe(false);
  });
});

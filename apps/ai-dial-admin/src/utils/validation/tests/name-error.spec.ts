import { describe, expect, test, vi } from 'vitest';

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
  test('Should return translated error', () => {
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
  test('Should return translated error', () => {
    const res = getErrorForName('n', ['name'], mockT);

    expect(res).toEqual({
      type: ErrorType.LENGTH,
      text: 'Translated Text',
    });
  });

  test('Should return empty error', () => {
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

  test('Should return empty', () => {
    const res = getErrorForName('name', ['names'], mockT);

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

  FORBIDDEN_NAME_SYMBOLS.forEach((symbol) => {
    test(`Should return forbidden chars error for symbol: ${symbol}`, () => {
      const nameWithSymbol = `name${symbol}`;
      const res2 = getErrorForName(nameWithSymbol, ['names']);

      expect(res2).toEqual({
        type: ErrorType.FORBIDDEN_CHARS,
        text: '',
      });
    });
  });

  test('Should allow forbidden symbols when checkForbiddenChars is false', () => {
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
});

describe('getErrorForDisplayName', () => {
  test('returns error if name is undefined', () => {
    const result = getErrorForDisplayName(undefined);

    expect(result).toBeNull();
  });

  test('returns error if name is too short', () => {
    const result1 = getErrorForDisplayName('a', false, mockT);
    const result2 = getErrorForDisplayName('a', false, void 0);

    expect(result1).toEqual({
      type: ErrorType.LENGTH,
      text: 'Translated Text',
    });
    expect(result2).toEqual({
      type: ErrorType.LENGTH,
      text: '',
    });
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

import { describe, expect, test, vi } from 'vitest';
import { ErrorType } from '@/src/types/error-type';
import { getErrorForName, forbiddenNameSymbols } from '../name-error';

describe('Utils :: validations :: getErrorForName', () => {
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
    const res1 = getErrorForName('name', ['names'], mockT, true);
    const res2 = getErrorForName('name', ['names'], void 0, true);

    expect(res1).toEqual({
      type: ErrorType.EXISTING,
      text: 'Translated Text',
    });

    expect(res2).toEqual({
      type: ErrorType.EXISTING,
      text: '',
    });
  });

  forbiddenNameSymbols.forEach((symbol) => {
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
    const res1 = getErrorForName(nameWithForbiddenSymbol, ['names'], mockT, false, false);
    const res2 = getErrorForName(nameWithForbiddenSymbol, ['names'], undefined, false, false);

    expect(res1).toBeNull();
    expect(res2).toBeNull();
  });
});

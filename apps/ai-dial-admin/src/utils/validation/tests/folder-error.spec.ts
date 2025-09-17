import { describe, expect, test, vi } from 'vitest';

import { FORBIDDEN_NAME_SYMBOLS } from '@/src/constants/validation';
import { ErrorType } from '@/src/types/error-type';
import { getErrorForFolderName } from '../folder-error';

describe('getErrorForFolderName', () => {
  const mockT = vi.fn().mockReturnValue('Translated Text');

  test('Should return translated error when name already exists', () => {
    const res1 = getErrorForFolderName('folder', ['folder'], mockT);
    const res2 = getErrorForFolderName('folder', ['folder']);

    expect(res1).toEqual({
      type: ErrorType.EXISTING,
      text: 'Translated Text',
    });

    expect(res2).toEqual({
      type: ErrorType.EXISTING,
      text: '',
    });
  });

  test('Should return empty error when name does not exist', () => {
    const res = getErrorForFolderName('folder', ['otherFolder'], mockT);

    expect(res).toBeNull();
  });

  FORBIDDEN_NAME_SYMBOLS.forEach((symbol) => {
    test(`Should return forbidden chars error for symbol: ${symbol}`, () => {
      const folderNameWithSymbol = `folder${symbol}`;
      const res = getErrorForFolderName(folderNameWithSymbol, ['otherFolder']);

      expect(res).toEqual({
        type: ErrorType.FORBIDDEN_CHARS,
        text: '',
      });
    });
  });

  test('Should allow forbidden symbols when checkForbiddenChars is false', () => {
    const folderNameWithForbiddenSymbol = 'folder%';
    const res1 = getErrorForFolderName(folderNameWithForbiddenSymbol, ['otherFolder'], mockT, false);
    const res2 = getErrorForFolderName(folderNameWithForbiddenSymbol, ['otherFolder'], undefined, false);

    expect(res1).toBeNull();
    expect(res2).toBeNull();
  });

  FORBIDDEN_NAME_SYMBOLS.forEach((symbol) => {
    test(`Should return translated forbidden chars error for symbol: ${symbol}`, () => {
      const folderNameWithSymbol = `folder${symbol}`;
      const res1 = getErrorForFolderName(folderNameWithSymbol, ['otherFolder'], mockT);

      expect(res1).toEqual({
        type: ErrorType.FORBIDDEN_CHARS,
        text: 'Translated Text',
      });
    });
  });

  test('Should return empty error for undefined folder name', () => {
    const res = getErrorForFolderName(undefined, ['otherFolder']);
    expect(res).toBeNull();
  });
});

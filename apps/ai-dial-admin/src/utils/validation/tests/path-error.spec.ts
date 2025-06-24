import { ErrorType } from '@/src/types/error-type';
import { describe, expect, test, vi } from 'vitest';
import { getErrorForPath } from '../path-error';

describe('Utils :: validations :: getErrorForPath', () => {
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

  test.skip('Should return invalid error when path does not match regex', () => {
    const invalidPath = 'invalid path with spaces';
    const res = getErrorForPath(invalidPath, mockT);
    expect(res).toEqual({
      type: ErrorType.INVALID,
      text: 'Translated Text',
    });
  });

  test.skip('Should return invalid error without translator function', () => {
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

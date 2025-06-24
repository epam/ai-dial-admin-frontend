import { ErrorType } from '@/src/types/error-type';
import { getErrorForDescription } from '../description-error';
import { describe, expect, test, vi } from 'vitest';

describe('Utils :: validations :: getErrorForDescription', () => {
  const mockT = vi.fn().mockReturnValue('Translated Text');

  test('Should return translated error', () => {
    const res = getErrorForDescription(new Array(2049).fill('a').join(), mockT);

    expect(res).toEqual({
      type: ErrorType.LENGTH,
      text: 'Translated Text',
    });
  });

  test('Should return empty error', () => {
    const res = getErrorForDescription(new Array(2049).fill('a').join());

    expect(res).toEqual({
      type: ErrorType.LENGTH,
      text: '',
    });
  });

  test('Should return empty', () => {
    const res = getErrorForDescription();

    expect(res).toBeNull();
  });
});

import { describe, expect, test, vi } from 'vitest';
import { ErrorType } from '@/src/types/error-type';
import { getErrorForIntro } from '../intro-error';

describe('Utils :: validations :: getErrorForIntro', () => {
  const mockT = vi.fn().mockReturnValue('Translated Text');

  test('Should return translated error', () => {
    const res = getErrorForIntro(new Array(2049).fill('a').join(), mockT);

    expect(res).toEqual({
      type: ErrorType.LENGTH,
      text: 'Translated Text',
    });
  });

  test('Should return empty error', () => {
    const res = getErrorForIntro(new Array(2049).fill('a').join());

    expect(res).toEqual({
      type: ErrorType.LENGTH,
      text: '',
    });
  });

  test('Should return empty', () => {
    const res = getErrorForIntro();

    expect(res).toBeNull();
  });
});

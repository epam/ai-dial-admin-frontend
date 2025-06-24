import { ErrorType } from '@/src/types/error-type';
import { getErrorForName } from '../name-error';
import { describe, expect, test, vi } from 'vitest';

describe('Utils :: validations :: getErrorForName', () => {
  const mockT = vi.fn().mockReturnValue('Translated Text');
  test('Should return translated error', () => {
    const res = getErrorForName('name', ['name'], mockT);

    expect(res).toEqual({
      type: ErrorType.EXISTING,
      text: 'Translated Text',
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
    const res = getErrorForName('n', ['name']);

    expect(res).toEqual({
      type: ErrorType.LENGTH,
      text: '',
    });
  });

  test('Should return empty', () => {
    const res = getErrorForName('name', ['names'], mockT);

    expect(res).toBeNull();
  });

  test('Should return translated error for not unique name', () => {
    const res = getErrorForName(void 0, void 0, mockT, true);

    expect(res).toEqual({
      type: ErrorType.EXISTING,
      text: 'Translated Text',
    });
  });
});

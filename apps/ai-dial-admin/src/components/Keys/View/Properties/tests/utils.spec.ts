import { ErrorI18nKey } from '@/src/constants/i18n';
import { ErrorType } from '@/src/types/error-type';
import { describe, expect, test, vi } from 'vitest';
import { getErrorForKey } from '../utils';

describe('Keys list :: getErrorForKey', () => {
  const key = 'my-key';

  test('returns EXISTING error object when key exists in keys array (with t)', () => {
    const keys = ['my-key', 'another-key'];
    const t = vi.fn().mockReturnValue('Key already exists');

    const result = getErrorForKey(key, keys, t);

    expect(result).toEqual({
      type: ErrorType.EXISTING,
      text: 'Key already exists',
    });
    expect(t).toHaveBeenCalledWith(ErrorI18nKey.KeyValueExists);
  });

  test('returns EXISTING error object with empty string if t is not provided', () => {
    const keys = ['my-key', 'another-key'];

    const result = getErrorForKey(key, keys);

    expect(result).toEqual({
      type: ErrorType.EXISTING,
      text: '',
    });
  });

  test('returns null if key is not in the keys array', () => {
    const keys = ['some-other-key'];
    const t = vi.fn();

    const result = getErrorForKey(key, keys, t);

    expect(result).toBeNull();
    expect(t).not.toHaveBeenCalled();
  });

  test('returns null if keys array is undefined', () => {
    const t = vi.fn();

    const result = getErrorForKey(key, undefined, t);

    expect(result).toBeNull();
    expect(t).not.toHaveBeenCalled();
  });
});

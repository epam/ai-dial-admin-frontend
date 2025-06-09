import { ErrorType } from '@/src/types/error-type';
import { CreateI18nKey } from '@/src/constants/i18n';
import { KeyStatus } from '@/src/types/key';
import { getErrorForKey, getColorClass } from '../keys-list';

describe('Keys list :: getErrorForKey', () => {
  const key = 'my-key';

  it('returns EXISTING error object when key exists in keys array (with t)', () => {
    const keys = ['my-key', 'another-key'];
    const t = jest.fn().mockReturnValue('Key already exists');

    const result = getErrorForKey(key, keys, t);

    expect(result).toEqual({
      type: ErrorType.EXISTING,
      text: 'Key already exists',
    });
    expect(t).toHaveBeenCalledWith(CreateI18nKey.ErrorKey);
  });

  it('returns EXISTING error object with empty string if t is not provided', () => {
    const keys = ['my-key', 'another-key'];

    const result = getErrorForKey(key, keys);

    expect(result).toEqual({
      type: ErrorType.EXISTING,
      text: '',
    });
  });

  it('returns null if key is not in the keys array', () => {
    const keys = ['some-other-key'];
    const t = jest.fn();

    const result = getErrorForKey(key, keys, t);

    expect(result).toBeNull();
    expect(t).not.toHaveBeenCalled();
  });

  it('returns null if keys array is undefined', () => {
    const t = jest.fn();

    const result = getErrorForKey(key, undefined, t);

    expect(result).toBeNull();
    expect(t).not.toHaveBeenCalled();
  });
});

describe('Keys list :: getColorClass', () => {
  it('returns accent class for VALID status', () => {
    const result = getColorClass(KeyStatus.VALID, 'light');
    expect(result).toBe('bg-accent-secondary');
  });

  it('returns orange-800 for ALMOST_EXPIRED in light theme', () => {
    const result = getColorClass(KeyStatus.ALMOST_EXPIRED, 'light');
    expect(result).toBe('bg-orange-800');
  });

  it('returns orange-400 for ALMOST_EXPIRED in dark theme', () => {
    const result = getColorClass(KeyStatus.ALMOST_EXPIRED, 'dark');
    expect(result).toBe('bg-orange-400');
  });

  it('returns red-800 for other statuses in light theme', () => {
    const result = getColorClass('EXPIRED', 'light');
    expect(result).toBe('bg-red-800');
  });

  it('returns red-400 for other statuses in dark theme', () => {
    const result = getColorClass('EXPIRED', 'dark');
    expect(result).toBe('bg-red-400');
  });
});

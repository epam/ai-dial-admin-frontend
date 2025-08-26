import { describe, expect, test } from 'vitest';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { getMaxAttachmentError } from '../is-valid-model';

describe('getMaxAttachmentError', () => {
  const t = (key: string) => key;

  test('returns null if maxInputAttachments is falsy', () => {
    expect(getMaxAttachmentError(undefined, t)).toBeUndefined();
    expect(getMaxAttachmentError(0, t)).toBeUndefined();
    expect(getMaxAttachmentError('', t)).toBeUndefined();
  });

  test('returns null if maxInputAttachments is less than or equal to limit', () => {
    expect(getMaxAttachmentError(3, t)).toBeUndefined();
    expect(getMaxAttachmentError('4', t)).toBeUndefined();
    expect(getMaxAttachmentError(5, t)).toBeUndefined();
  });

  test('returns error if maxInputAttachments is greater than limit', () => {
    expect(getMaxAttachmentError(10000, t)).toBe(ErrorI18nKey.MaxNumberError);
    expect(getMaxAttachmentError('1000000', t)).toBe(ErrorI18nKey.MaxNumberError);
  });

  test('returns undefined if t is not provided and invalid', () => {
    expect(getMaxAttachmentError(10)).toBeUndefined();
  });
});

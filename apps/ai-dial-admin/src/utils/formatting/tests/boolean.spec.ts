import { BasicI18nKey } from '@/src/constants/i18n';
import { describe, test, expect } from 'vitest';
import { formatRequired } from '../boolean';

describe('formatRequired', () => {
  test('returns translated Yes when value is truthy', () => {
    const t = (key: string) => key;
    const res = formatRequired('non-empty', t);
    expect(res).toBe(BasicI18nKey.Yes);
  });

  test('returns translated No when value is falsy', () => {
    const t = (key: string) => key;
    const res = formatRequired('', t);
    expect(res).toBe(BasicI18nKey.No);
  });
});

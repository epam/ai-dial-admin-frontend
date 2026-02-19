import { ValidityStatus } from '@/src/types/key';
import { getColorClassName } from '../utils';
import { describe, expect, test } from 'vitest';

describe('Keys list :: getColorClassName', () => {
  test('returns accent class for VALID status', () => {
    const result = getColorClassName(ValidityStatus.VALID, 'light');
    expect(result).toBe('bg-accent-secondary');
  });

  test('returns red-800 for other statuses in light theme', () => {
    const result = getColorClassName('EXPIRED', 'light');
    expect(result).toBe('bg-red-800');
  });

  test('returns red-400 for other statuses in dark theme', () => {
    const result = getColorClassName('EXPIRED', 'dark');
    expect(result).toBe('bg-red-400');
  });
});

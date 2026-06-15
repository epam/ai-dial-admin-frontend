import { describe, expect, test } from 'vitest';

import { formatMemoryBytes } from '@/src/components/Containers/View/Metrics/utils';

describe('formatMemoryBytes', () => {
  test('returns null for null input', () => {
    expect(formatMemoryBytes(null)).toBeNull();
  });

  test('keeps small values in bytes', () => {
    expect(formatMemoryBytes(512)).toEqual({ value: 512, unit: 'B' });
  });

  test('scales to KB / MB / GB at 1024 steps', () => {
    expect(formatMemoryBytes(1024)).toEqual({ value: 1, unit: 'KB' });
    expect(formatMemoryBytes(5 * 1024 * 1024)).toEqual({ value: 5, unit: 'MB' });
    expect(formatMemoryBytes(2 * 1024 * 1024 * 1024)).toEqual({ value: 2, unit: 'GB' });
  });

  test('picks GB and rounds to one decimal for large values', () => {
    // 15.4e9 bytes ≈ 14.3 GB
    expect(formatMemoryBytes(15_400_000_000)).toEqual({ value: 14.3, unit: 'GB' });
  });

  test('handles zero', () => {
    expect(formatMemoryBytes(0)).toEqual({ value: 0, unit: 'B' });
  });
});

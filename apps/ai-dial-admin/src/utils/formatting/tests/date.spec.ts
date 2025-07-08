import { describe, expect, test, vi } from 'vitest';
import { formatDateToLocalString } from '@/src/utils/formatting/date';

describe('Utils :: formatDateToLocalString', () => {
  test('returns the formatted date in MM.DD.YYYY format', () => {
    const mockDate = new Date('2023-12-25T12:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    const result = formatDateToLocalString('2023-12-25T12:00:00Z');

    expect(result).toBe(mockDate.toLocaleDateString());

    vi.useRealTimers();
  });
});

import { describe, expect, test, vi } from 'vitest';
import { formatDateToLocalString, formatDateTimeToLocalString } from '@/src/utils/formatting/date';

describe('Utils :: formatDateTimeToLocalString', () => {
  test('returns empty string', () => {
    const result = formatDateTimeToLocalString();

    expect(result).toBe('');
  });

  test('returns the formatted date in Local date format', () => {
    const mockDate = new Date('2023-12-25T12:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    const result = formatDateTimeToLocalString('2023-12-25T12:00:00Z');

    expect(result).toBe(mockDate.toLocaleDateString());

    vi.useRealTimers();
  });
});

describe('Utils :: formatDateToLocalString', () => {
  test('returns empty string', () => {
    const result = formatDateToLocalString();

    expect(result).toBe('');
  });

  test('returns the formatted date in Local date format', () => {
    const mockDate = new Date('2023-12-25T12:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    const result = formatDateToLocalString('2023-12-25T12:00:00Z');

    expect(result).toBe(mockDate.toLocaleDateString());

    vi.useRealTimers();
  });
});

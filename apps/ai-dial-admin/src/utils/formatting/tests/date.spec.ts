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

    expect(result).toBe(mockDate.toLocaleString());

    vi.useRealTimers();
  });

  test('formats a numeric timestamp', () => {
    const timestamp = new Date('2023-12-25T12:00:00Z').getTime();

    const result = formatDateTimeToLocalString(timestamp);

    expect(result).toBe(new Date(timestamp).toLocaleString());
  });

  test('formats a numeric timestamp passed as a string', () => {
    const timestamp = new Date('2023-12-25T12:00:00Z').getTime();

    const result = formatDateTimeToLocalString(String(timestamp));

    expect(result).toBe(new Date(timestamp).toLocaleString());
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

  test('formats a numeric timestamp', () => {
    const timestamp = new Date('2023-12-25T12:00:00Z').getTime();

    const result = formatDateToLocalString(timestamp);

    expect(result).toBe(new Date(timestamp).toLocaleDateString());
  });

  test('formats a numeric timestamp passed as a string', () => {
    const timestamp = new Date('2023-12-25T12:00:00Z').getTime();

    const result = formatDateToLocalString(String(timestamp));

    expect(result).toBe(new Date(timestamp).toLocaleDateString());
  });
});

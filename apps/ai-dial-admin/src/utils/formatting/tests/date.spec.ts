import { formatDateToLocalTime, formatTimestampToDate } from '@/src/utils/formatting/date';
import { describe, expect, test } from 'vitest';

describe('Utils :: date :: formatDateToLocalTime', () => {
  // TODO: fake timezone to 'America/New_York'
  test.skip('Should correctly handle thousands number', () => {
    const date = formatDateToLocalTime('1970-01-01T05:00:00Z');

    expect(date).toBe('01/01, 00:00');
  });
});

describe('Utils :: date :: formatTimestampToDate', () => {
  test.skip('Should correctly formatted timestamp', () => {
    const date = formatTimestampToDate(1741349487370, 'UTC');

    expect(date).toBe('03.07.2025 13:11');
  });
});

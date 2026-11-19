import { describe, expect, test } from 'vitest';

import { formatIsoDate, parseIsoDate } from '../lifecycle-date';

describe('parseIsoDate', () => {
  test('Should read a YYYY-MM-DD string as a local date', () => {
    const date = parseIsoDate('2027-06-30');

    expect(date?.getFullYear()).toBe(2027);
    expect(date?.getMonth()).toBe(5);
    expect(date?.getDate()).toBe(30);
    expect(date?.getHours()).toBe(0);
  });

  test.each([undefined, '', 'soon', '2027-6-3', '2027-06-30T00:00:00Z', '30-06-2027', ' 2027-06-30'])(
    'Should return null for %j',
    (value) => {
      expect(parseIsoDate(value)).toBeNull();
    },
  );

  test.each(['2027-02-31', '2027-13-01', '2027-00-10', '2027-04-31'])(
    'Should return null for the nonexistent date %s',
    (value) => {
      expect(parseIsoDate(value)).toBeNull();
    },
  );

  test('Should accept a leap day only in a leap year', () => {
    expect(parseIsoDate('2028-02-29')).not.toBeNull();
    expect(parseIsoDate('2027-02-29')).toBeNull();
  });
});

describe('formatIsoDate', () => {
  test('Should write the local year, month and day', () => {
    expect(formatIsoDate(new Date(2027, 11, 31, 23, 59))).toBe('2027-12-31');
  });

  test('Should zero-pad the month and day', () => {
    expect(formatIsoDate(new Date(2027, 0, 5))).toBe('2027-01-05');
  });

  test('Should round-trip with parseIsoDate', () => {
    expect(formatIsoDate(parseIsoDate('2027-06-30') as Date)).toBe('2027-06-30');
  });

  test('Should not shift the day for a date at local midnight', () => {
    expect(formatIsoDate(new Date(2027, 5, 30, 0, 0, 0))).toBe('2027-06-30');
  });
});

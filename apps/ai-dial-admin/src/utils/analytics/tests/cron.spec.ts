import { describe, expect, test } from 'vitest';

import { isValidSixFieldCron } from '@/src/utils/analytics/cron';

describe('Utils :: analytics :: isValidSixFieldCron', () => {
  test.each(['0 */5 * * * *', '0 0 * * * *', '0 0 0 * * *', '0 0 1 * * *', '0 * * * * *'])(
    'accepts the six-field expression %s',
    (expression) => {
      expect(isValidSixFieldCron(expression)).toBe(true);
    },
  );

  test.each(['*/5 * * * *', '0 0 * * *', '* * * * *'])('rejects the five-field expression %s', (expression) => {
    expect(isValidSixFieldCron(expression)).toBe(false);
  });

  test('rejects a seven-field expression', () => {
    expect(isValidSixFieldCron('0 0 0 * * * 2026')).toBe(false);
  });

  test('rejects an empty or blank expression', () => {
    expect(isValidSixFieldCron('')).toBe(false);
    expect(isValidSixFieldCron('   ')).toBe(false);
  });

  test('tolerates surrounding and repeated whitespace', () => {
    expect(isValidSixFieldCron('  0   0  0 * * *  ')).toBe(true);
  });

  test('accepts named month and day-of-week fields', () => {
    expect(isValidSixFieldCron('0 0 12 * JAN MON-FRI')).toBe(true);
  });

  test('rejects a field carrying an unsupported character', () => {
    expect(isValidSixFieldCron('0 0 0 * * !')).toBe(false);
  });

  test.each([
    'foo bar baz qux quux corge',
    'LLLL LL L L L L',
    '1-2-3 ,,, // -- 99999 ABCDEF',
    '0 0 0 * * MONDAY',
    '0 0 0 * * ,',
  ])('rejects the six-token but ungrammatical expression %s', (expression) => {
    expect(isValidSixFieldCron(expression)).toBe(false);
  });

  test.each(['0 0,30 * * * *', '0 0 9-17 * * MON-FRI', '0 0 0 L * *', '30 0 0 1,15 * ?'])(
    'accepts the list, range and last-day expression %s',
    (expression) => {
      expect(isValidSixFieldCron(expression)).toBe(true);
    },
  );
});

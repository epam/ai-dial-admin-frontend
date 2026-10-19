import { describe, expect, test } from 'vitest';

import { getTotalCount } from '@/src/utils/api/get-total-count';

const withHeader = (value?: string) => new Response('', { headers: value == null ? {} : { 'X-Total-Count': value } });

describe('getTotalCount', () => {
  test('reads a numeric header', () => {
    expect(getTotalCount(withHeader('4200'))).toBe(4200);
  });

  test('reads a zero total', () => {
    expect(getTotalCount(withHeader('0'))).toBe(0);
  });

  test('returns undefined when the header is absent', () => {
    expect(getTotalCount(withHeader())).toBeUndefined();
  });

  test.each(['abc', '', '  '])('returns undefined for a header that is not a count (%j)', (value) => {
    expect(getTotalCount(withHeader(value))).toBeUndefined();
  });
});

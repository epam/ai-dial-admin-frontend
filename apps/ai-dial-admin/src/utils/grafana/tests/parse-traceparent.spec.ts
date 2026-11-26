import { describe, expect, test } from 'vitest';

import { parseTraceparent } from '../parse-traceparent';

const TRACE_ID = '4bf92f3577b34da6a3ce929d0e0e4736';
const SPAN_ID = '00f067aa0ba902b7';

describe('parseTraceparent', () => {
  test('returns the trace id of a valid header', () => {
    expect(parseTraceparent(`00-${TRACE_ID}-${SPAN_ID}-01`)).toBe(TRACE_ID);
  });

  test('accepts upper-case hex and surrounding whitespace', () => {
    expect(parseTraceparent(` 00-${TRACE_ID.toUpperCase()}-${SPAN_ID}-01 `)).toBe(TRACE_ID);
  });

  test('ignores extra fields a later version may add', () => {
    expect(parseTraceparent(`01-${TRACE_ID}-${SPAN_ID}-01-extra`)).toBe(TRACE_ID);
  });

  test.each([
    ['missing', undefined],
    ['null', null],
    ['empty', ''],
    ['too short trace id', `00-abc-${SPAN_ID}-01`],
    ['non-hex trace id', `00-${'z'.repeat(32)}-${SPAN_ID}-01`],
    ['all-zero trace id', `00-${'0'.repeat(32)}-${SPAN_ID}-01`],
    ['forbidden version', `ff-${TRACE_ID}-${SPAN_ID}-01`],
    ['missing flags', `00-${TRACE_ID}-${SPAN_ID}`],
  ])('returns null for %s', (_name, value) => {
    expect(parseTraceparent(value)).toBeNull();
  });
});

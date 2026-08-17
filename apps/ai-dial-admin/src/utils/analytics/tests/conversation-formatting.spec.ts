import { describe, expect, test } from 'vitest';

import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import {
  formatCompactNumber,
  formatConversationDuration,
  formatConversationSpan,
  formatRelativeTime,
  formatSignificantCost,
} from '@/src/utils/analytics/conversation-formatting';

const NOW = Date.parse('2026-07-28T12:00:00.000Z');
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Delegates to the app-wide formatNumberWithExponent so a token count reads the same here as elsewhere.
describe('formatCompactNumber', () => {
  test.each([
    [0, '0'],
    [7, '7'],
    [999, '999'],
    [1000, '1 K'],
    [7200, '7.2 K'],
    [8004, '8 K'],
    [1284507, '1.3 M'],
    [120000, '120 K'],
    [1000000000, '1 B'],
  ])('renders %s as %s', (value, expected) => {
    expect(formatCompactNumber(value)).toBe(expected);
  });

  test('reads a numeric string as well as a number', () => {
    expect(formatCompactNumber('7200')).toBe('7.2 K');
  });

  test.each([
    ['null', null],
    ['an empty value', ''],
    ['an unparseable value', 'n/a'],
  ])('renders %s as an empty cell rather than NaN', (_label, value) => {
    expect(formatCompactNumber(value)).toBe('');
  });
});

describe('formatSignificantCost', () => {
  // The shared currency formatter renders every one of a Decimal(38,12) sum's digits; this one does not.
  test.each([
    ['0.090342871559', '$0.09'],
    ['0.003612544180', '$0.0036'],
    ['0.079318604227', '$0.079'],
    ['0.5', '$0.5'],
  ])('renders sub-dollar %s at two significant digits as %s', (value, expected) => {
    expect(formatSignificantCost(value)).toBe(expected);
  });

  // From a dollar up the value is rounded and abbreviated rather than cut to two significant digits,
  // which reported $10 as $1 by stripping a zero that carried magnitude, and went exponential past two
  // integer digits. On a cost column read verbatim, understating by 10x is the worst failure available.
  test.each([
    ['10', '$10'],
    ['20', '$20'],
    ['19.74', '$19.7'],
    ['11.560563248017', '$11.6'],
    ['100', '$100'],
    ['105', '$105'],
    ['1200', '$1.2 K'],
    ['12000', '$12 K'],
  ])('renders %s as %s, neither truncated nor exponential', (value, expected) => {
    expect(formatSignificantCost(value)).toBe(expected);
  });

  test.each([
    ['0.000001234', '$0.0000012'],
    // Below 1e-7 Big switches toPrecision to exponential notation; the scale is derived instead.
    ['0.00000001', '$0.00000001'],
  ])('keeps %s legible as %s however small it is', (value, expected) => {
    expect(formatSignificantCost(value)).toBe(expected);
  });

  test('renders a zero cost plainly', () => {
    expect(formatSignificantCost('0.000000000000')).toBe('$0');
  });

  test.each([
    ['null', null],
    ['an empty value', ''],
    ['an unparseable value', 'n/a'],
  ])('renders %s as an empty cell', (_label, value) => {
    expect(formatSignificantCost(value)).toBe('');
  });
});

describe('formatRelativeTime', () => {
  test.each([
    ['30 seconds', 30 * 1000, 'just now'],
    ['12 minutes', 12 * MINUTE, '12m ago'],
    ['38 minutes', 38 * MINUTE, '38m ago'],
    ['1 hour', HOUR, '1h ago'],
    ['3 hours', 3 * HOUR, '3h ago'],
    ['2 days', 2 * DAY, '2d ago'],
  ])('renders an activity %s old as %s', (_label, elapsed, expected) => {
    expect(formatRelativeTime(NOW - elapsed, NOW)).toBe(expected);
  });

  // The service returns an ISO-8601 string with a `Z`; epoch millis are accepted too.
  test('reads a zoned ISO string as well as epoch millis', () => {
    expect(formatRelativeTime(new Date(NOW - 12 * MINUTE).toISOString(), NOW)).toBe('12m ago');
  });

  // A zoneless value would otherwise be read as local time and shift by the viewer's UTC offset, which
  // silently misreports every activity cell in any non-UTC timezone.
  test.each([
    ['T-separated', '2026-07-28T11:48:00.000'],
    ['space-separated', '2026-07-28 11:48:00.000'],
    ['without milliseconds', '2026-07-28T11:48:00'],
    ['without seconds', '2026-07-28T11:48'],
  ])('reads a %s zoneless timestamp as UTC, not local time', (_label, value) => {
    expect(formatRelativeTime(value, NOW)).toBe('12m ago');
  });

  // The clock is a parameter so the helper stays deterministic and needs no fake timers.
  test('never reports a future activity as negative', () => {
    expect(formatRelativeTime(NOW + HOUR, NOW)).toBe('just now');
  });

  test.each([
    ['null', null],
    ['an empty value', ''],
  ])('renders %s as empty', (_label, value) => {
    expect(formatRelativeTime(value, NOW)).toBe('');
  });
});

describe('formatConversationSpan', () => {
  test.each([
    ['40 seconds', 40 * 1000, '40 sec'],
    ['6 minutes', 6 * MINUTE, '6 min'],
    ['47 minutes', 47 * MINUTE, '47 min'],
    ['2 hours', 2 * HOUR, '2 h'],
    ['3 days', 3 * DAY, '3 d'],
  ])('renders a %s span as %s', (_label, span, expected) => {
    expect(formatConversationSpan(NOW - span, NOW)).toBe(expected);
  });

  test('renders a single-turn conversation as at least one second, not zero', () => {
    expect(formatConversationSpan(NOW, NOW)).toBe('1 sec');
  });

  test('renders nothing when the bounds are inverted rather than a negative span', () => {
    expect(formatConversationSpan(NOW, NOW - HOUR)).toBe('');
  });

  test.each([
    ['a missing start', null, NOW],
    ['a missing end', NOW, null],
  ])('renders %s as empty', (_label, from, to) => {
    expect(formatConversationSpan(from, to)).toBe('');
  });
});

describe('formatConversationDuration', () => {
  test.each([
    ['a sub-second duration', 340, '0.3s'],
    ['a seconds duration', 6709, '6.7s'],
    ['a whole-second duration', 30000, '30s'],
    ['a duration just under a minute', 59999, '60s'],
    ['a minutes duration', 275234, '4m 35s'],
    ['a whole-minute duration', 5 * MINUTE, '5m 0s'],
    ['an hours duration', 2 * HOUR + 30 * MINUTE, '2h 30m'],
  ])('renders %s as %s', (_label, millis, expected) => {
    expect(formatConversationDuration(millis)).toBe(expected);
  });

  test('reads a numeric string as well as a number', () => {
    expect(formatConversationDuration('6709')).toBe('6.7s');
  });

  // A conversation that ran took time, so a zero records that the backend never measured it.
  test.each([
    ['zero', 0],
    ['a negative value', -1],
    ['null', null],
    ['an empty value', ''],
    ['an unparseable value', 'n/a'],
  ])('renders %s as the unavailable marker rather than a zero duration', (_label, value) => {
    expect(formatConversationDuration(value)).toBe(UNAVAILABLE_VALUE);
  });
});

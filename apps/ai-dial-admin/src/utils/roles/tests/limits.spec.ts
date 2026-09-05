import { describe, expect, test } from 'vitest';

import { UNLIMITED_VALUE } from '@/src/constants/role';
import { normalizeRoleLimits, toWireRoleLimits } from '../limits';

describe('normalizeRoleLimits', () => {
  test('keeps a safe-range number token as a number', () => {
    expect(normalizeRoleLimits({ minute: 100 })).toEqual({ minute: 100 });
  });

  test('drops a token whose value overflows a safe integer (e.g. the unlimited sentinel), rather than keeping a lossily-rounded number', () => {
    // A literal this large is already rounded by the JS engine before this function ever sees it —
    // exactly the scenario a real `JSON.parse` produces for Core's `Long.MAX_VALUE` sentinel.
    expect(normalizeRoleLimits({ minute: 9223372036854775807 })).toEqual({});
  });

  test('drops a token whose value is an out-of-range numeric string', () => {
    expect(normalizeRoleLimits({ minute: UNLIMITED_VALUE })).toEqual({});
  });

  test("drops `enabled` — it has no representation on Core's wire format at all", () => {
    expect(normalizeRoleLimits({ enabled: true })).toEqual({});
  });

  test('skips a null/undefined token rather than coercing it to 0', () => {
    expect(normalizeRoleLimits({ minute: null, day: undefined, week: 10 })).toEqual({ week: 10 });
  });

  test('returns undefined for a null/undefined input', () => {
    expect(normalizeRoleLimits(null)).toBeUndefined();
    expect(normalizeRoleLimits(undefined)).toBeUndefined();
  });

  test('normalizes every token on a full four-token object, dropping only the out-of-range one, all as numbers', () => {
    expect(normalizeRoleLimits({ minute: 10, day: 100, week: 500, month: UNLIMITED_VALUE })).toEqual({
      minute: 10,
      day: 100,
      week: 500,
    });
  });

  test('coerces a safe-range numeric string to a number', () => {
    expect(normalizeRoleLimits({ minute: '10' })).toEqual({ minute: 10 });
  });

  test('keeps a decimal number token as a number', () => {
    expect(normalizeRoleLimits({ minute: 1.5 })).toEqual({ minute: 1.5 });
  });

  test('keeps a decimal numeric string token as a number', () => {
    expect(normalizeRoleLimits({ minute: '0.25' })).toEqual({ minute: 0.25 });
  });

  test('drops NaN and Infinity tokens', () => {
    expect(normalizeRoleLimits({ minute: NaN, day: Infinity, week: -Infinity })).toEqual({});
  });
});

describe('toWireRoleLimits', () => {
  test('passes a safe-range number token through unchanged', () => {
    expect(toWireRoleLimits({ minute: 100 })).toEqual({ minute: 100 });
  });

  test('skips a null/undefined token', () => {
    expect(toWireRoleLimits({ minute: undefined, week: 10 })).toEqual({ week: 10 });
  });

  test('returns an empty object for a fully-unlimited (all tokens already dropped) limits object', () => {
    expect(toWireRoleLimits({})).toEqual({});
  });

  test('returns undefined for a null/undefined input', () => {
    expect(toWireRoleLimits(null)).toBeUndefined();
    expect(toWireRoleLimits(undefined)).toBeUndefined();
  });
});

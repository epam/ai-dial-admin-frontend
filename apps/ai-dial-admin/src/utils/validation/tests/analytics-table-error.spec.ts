import { describe, expect, test } from 'vitest';

import { ErrorI18nKey } from '@/src/constants/i18n';
import { ErrorType } from '@/src/types/error-type';
import { getAnalyticsIdentifierError, getAnalyticsLengthError } from '@/src/utils/validation/analytics-table-error';

// Stub t() returns the key so assertions target the i18n key, not translated text.
const t = (key: string) => key;

describe('getAnalyticsIdentifierError', () => {
  test('returns null for a blank value (emptiness is signalled elsewhere)', () => {
    expect(getAnalyticsIdentifierError('', [], t)).toBeNull();
    expect(getAnalyticsIdentifierError('   ', [], t)).toBeNull();
  });

  test('accepts valid lowercase snake_case identifiers, trimming first', () => {
    expect(getAnalyticsIdentifierError('events', [], t)).toBeNull();
    expect(getAnalyticsIdentifierError('user_events_2', [], t)).toBeNull();
    expect(getAnalyticsIdentifierError('  events  ', [], t)).toBeNull();
  });

  test('rejects grammar violations with a forbidden-chars error', () => {
    for (const bad of ['Events', '_events', '2events', 'my-table', 'my table']) {
      expect(getAnalyticsIdentifierError(bad, [], t)).toEqual({
        type: ErrorType.FORBIDDEN_CHARS,
        text: ErrorI18nKey.SnakeCaseIdentifier,
      });
    }
  });

  test('rejects values longer than the identifier max length', () => {
    expect(getAnalyticsIdentifierError('a'.repeat(65), [], t)).toEqual({
      type: ErrorType.LENGTH,
      text: ErrorI18nKey.Length,
    });
    expect(getAnalyticsIdentifierError('a'.repeat(64), [], t)).toBeNull();
  });

  test('rejects a value that collides with an existing name (compared after trimming)', () => {
    expect(getAnalyticsIdentifierError('events', ['events', 'orders'], t)).toEqual({
      type: ErrorType.EXISTING,
      text: ErrorI18nKey.KeyValueExists,
    });
    expect(getAnalyticsIdentifierError('  events  ', ['events'], t)?.type).toBe(ErrorType.EXISTING);
    expect(getAnalyticsIdentifierError('events', ['orders'], t)).toBeNull();
  });
});

describe('getAnalyticsLengthError', () => {
  test('returns null when within the cap (blank allowed)', () => {
    expect(getAnalyticsLengthError('', 64, t)).toBeNull();
    expect(getAnalyticsLengthError('short', 64, t)).toBeNull();
    expect(getAnalyticsLengthError('a'.repeat(64), 64, t)).toBeNull();
  });

  test('returns a length error when over the cap (measured after trimming)', () => {
    expect(getAnalyticsLengthError('a'.repeat(65), 64, t)).toEqual({
      type: ErrorType.LENGTH,
      text: ErrorI18nKey.Length,
    });
    expect(getAnalyticsLengthError(`  ${'a'.repeat(64)}  `, 64, t)).toBeNull();
  });
});

import { describe, expect, test } from 'vitest';

import { AnalyticsEvaluatorsI18nKey } from '@/src/constants/i18n';
import { ErrorType } from '@/src/types/error-type';
import { getEvaluatorNameError } from '@/src/utils/validation/evaluator-name-error';

// Stub t() returns the key so assertions target the i18n key, not translated text.
const t = (key: string) => key;

describe('getEvaluatorNameError', () => {
  test('returns null for a blank value (emptiness is signalled elsewhere)', () => {
    expect(getEvaluatorNameError('', [], t)).toBeNull();
    expect(getEvaluatorNameError('   ', [], t)).toBeNull();
  });

  test('accepts a valid name, trimming first', () => {
    expect(getEvaluatorNameError('quality_check', [], t)).toBeNull();
    expect(getEvaluatorNameError('  quality_check  ', [], t)).toBeNull();
    expect(getEvaluatorNameError('a', [], t)).toBeNull();
  });

  test('rejects a leading digit with a format error', () => {
    expect(getEvaluatorNameError('2evaluator', [], t)).toEqual({
      type: ErrorType.FORBIDDEN_CHARS,
      text: AnalyticsEvaluatorsI18nKey.NameInvalid,
    });
  });

  test('rejects an uppercase letter with a format error', () => {
    expect(getEvaluatorNameError('Evaluator', [], t)).toEqual({
      type: ErrorType.FORBIDDEN_CHARS,
      text: AnalyticsEvaluatorsI18nKey.NameInvalid,
    });
  });

  test('rejects a space with a format error', () => {
    expect(getEvaluatorNameError('my evaluator', [], t)).toEqual({
      type: ErrorType.FORBIDDEN_CHARS,
      text: AnalyticsEvaluatorsI18nKey.NameInvalid,
    });
  });

  test('accepts exactly 64 characters and rejects 65', () => {
    expect(getEvaluatorNameError(`a${'a'.repeat(63)}`, [], t)).toBeNull();
    expect(getEvaluatorNameError(`a${'a'.repeat(64)}`, [], t)).toEqual({
      type: ErrorType.FORBIDDEN_CHARS,
      text: AnalyticsEvaluatorsI18nKey.NameInvalid,
    });
  });

  test('rejects a name already on the listing with an existing error', () => {
    expect(getEvaluatorNameError('quality_check', ['quality_check', 'other'], t)).toEqual({
      type: ErrorType.EXISTING,
      text: AnalyticsEvaluatorsI18nKey.NameTaken,
    });
  });

  test('rejects a duplicate differing only by surrounding whitespace, comparing trimmed', () => {
    expect(getEvaluatorNameError('  quality_check  ', ['quality_check'], t)).toEqual({
      type: ErrorType.EXISTING,
      text: AnalyticsEvaluatorsI18nKey.NameTaken,
    });
  });

  test('does not report an existing error when the name is not on the listing', () => {
    expect(getEvaluatorNameError('quality_check', ['other'], t)).toBeNull();
  });

  test('reports no error once an invalid or duplicate name is corrected to a valid, unused one', () => {
    expect(getEvaluatorNameError('Invalid Name', ['quality_check'], t)?.type).toBe(ErrorType.FORBIDDEN_CHARS);
    expect(getEvaluatorNameError('quality_check', ['quality_check'], t)?.type).toBe(ErrorType.EXISTING);
    expect(getEvaluatorNameError('quality_check_v2', ['quality_check'], t)).toBeNull();
  });
});

import { describe, expect, test } from 'vitest';
import { getActiveLimitType, isLimitTypeTotal, isLimitTypeSeparateTokenAndCompletions } from '../utils';
import { LimitType } from '../constants';

describe('ModelView/Limits utils', () => {
  test('getActiveLimitType returns SeparateTokenAndCompletions if both maxCompletionTokens and maxPromptTokens exist', () => {
    const model = {
      limits: {
        maxCompletionTokens: 100,
        maxPromptTokens: 200,
      },
    } as any;
    expect(getActiveLimitType(model)).toBe(LimitType.SeparateTokenAndCompletions);
  });

  test('getActiveLimitType returns Total if only maxTotalTokens exists', () => {
    const model = {
      limits: {
        maxTotalTokens: 300,
      },
    } as any;
    expect(getActiveLimitType(model)).toBe(LimitType.Total);
  });

  test('getActiveLimitType returns None if no limits', () => {
    const model = { limits: undefined } as any;
    expect(getActiveLimitType(model)).toBe(LimitType.None);
  });

  test('getActiveLimitType returns None if limits object is empty', () => {
    const model = { limits: {} } as any;
    expect(getActiveLimitType(model)).toBe(LimitType.None);
  });

  test('isLimitTypeTotal returns true for Total', () => {
    expect(isLimitTypeTotal(LimitType.Total)).toBe(true);
    expect(isLimitTypeTotal('Total')).toBe(true);
  });

  test('isLimitTypeTotal returns false for other types', () => {
    expect(isLimitTypeTotal(LimitType.SeparateTokenAndCompletions)).toBe(false);
    expect(isLimitTypeTotal(LimitType.None)).toBe(false);
  });

  test('isLimitTypeSeparateTokenAndCompletions returns true for SeparateTokenAndCompletions', () => {
    expect(isLimitTypeSeparateTokenAndCompletions(LimitType.SeparateTokenAndCompletions)).toBe(true);
    expect(isLimitTypeSeparateTokenAndCompletions('SeparateTokenAndCompletions')).toBe(true);
  });

  test('isLimitTypeSeparateTokenAndCompletions returns false for other types', () => {
    expect(isLimitTypeSeparateTokenAndCompletions(LimitType.Total)).toBe(false);
    expect(isLimitTypeSeparateTokenAndCompletions(LimitType.None)).toBe(false);
  });
});

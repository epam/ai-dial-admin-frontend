import { describe, expect, test, vi } from 'vitest';

import { AnalyticsEvaluatorsI18nKey } from '@/src/constants/i18n';
import { getEvaluatorCreatedMessage } from '@/src/utils/analytics/evaluator-created-message';

// Spy that echoes the key and its params, so a test can prove the version number reaches `t` — the
// suite's centralized mocked `t()` returns the key as-is and drops params, which cannot prove that.
const createTranslateSpy = () =>
  vi.fn((key: string, args?: Record<string, string | number>) => (args ? `${key}:${JSON.stringify(args)}` : key));

describe('getEvaluatorCreatedMessage', () => {
  test('reports a plain creation for version 1, with no version param', () => {
    const t = createTranslateSpy();
    const message = getEvaluatorCreatedMessage(1, t);
    expect(t).toHaveBeenCalledWith(AnalyticsEvaluatorsI18nKey.EvaluatorCreated);
    expect(message).toBe(AnalyticsEvaluatorsI18nKey.EvaluatorCreated);
  });

  test('reports success without naming a version when the response carries no version', () => {
    const t = createTranslateSpy();
    const message = getEvaluatorCreatedMessage(undefined, t);
    expect(t).toHaveBeenCalledWith(AnalyticsEvaluatorsI18nKey.EvaluatorCreatedVersionUnknown);
    expect(message).toBe(AnalyticsEvaluatorsI18nKey.EvaluatorCreatedVersionUnknown);
  });

  test('reports an appended version for a version other than 1, passing the version number to t', () => {
    const t = createTranslateSpy();
    const message = getEvaluatorCreatedMessage(7, t);
    expect(t).toHaveBeenCalledWith(AnalyticsEvaluatorsI18nKey.EvaluatorCreatedAsVersion, { version: 7 });
    expect(message).toBe(`${AnalyticsEvaluatorsI18nKey.EvaluatorCreatedAsVersion}:{"version":7}`);
  });

  test('treats 0 as an appended version rather than a created one, since === 1 is the only created arm', () => {
    const t = createTranslateSpy();
    getEvaluatorCreatedMessage(0, t);
    expect(t).toHaveBeenCalledWith(AnalyticsEvaluatorsI18nKey.EvaluatorCreatedAsVersion, { version: 0 });
  });
});

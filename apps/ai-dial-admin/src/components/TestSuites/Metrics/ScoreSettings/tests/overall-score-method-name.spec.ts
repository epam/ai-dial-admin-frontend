import { describe, expect, test } from 'vitest';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { OverallScoreType } from '@/src/models/evaluation/test-suite';
import { getOverallScoreMethodName } from '../overall-score-method-tooltip';

const t = (key: string, values?: Record<string, string | number>) =>
  values ? `${key}:${JSON.stringify(values)}` : key;

describe('getOverallScoreMethodName', () => {
  test('names the mean with the metric count', () => {
    expect(getOverallScoreMethodName({ type: OverallScoreType.Mean }, t, 3)).toBe(
      `${TestSuitesI18nKey.TrendsMeanOfNMetrics}:{"count":3}`,
    );
  });

  test('names the weighted mean with the number of weights', () => {
    const weights = [
      { metricName: 'a', outputField: 'f', weight: 0.7 },
      { metricName: 'b', outputField: 'f', weight: 0.3 },
    ];

    expect(getOverallScoreMethodName({ type: OverallScoreType.WeightedMean, weights }, t, 5)).toBe(
      `${TestSuitesI18nKey.TrendsWeightedMeanOfNMetrics}:{"count":2}`,
    );
  });

  test('falls back to the metric count for a weighted mean without weights', () => {
    expect(getOverallScoreMethodName({ type: OverallScoreType.WeightedMean, weights: [] }, t, 4)).toBe(
      `${TestSuitesI18nKey.TrendsWeightedMeanOfNMetrics}:{"count":4}`,
    );
  });

  test('names a specific function without a count', () => {
    expect(
      getOverallScoreMethodName(
        { type: OverallScoreType.Function, expression: { mode: 'aggregate', entity: 'e', select: [] } as never },
        t,
        4,
      ),
    ).toBe(TestSuitesI18nKey.OverallScoreFunction);
  });
});

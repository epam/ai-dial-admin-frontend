import { describe, expect, test } from 'vitest';

import { getStabilityMethodLabel } from '@/src/components/TestSuites/Trends/Stability/utils/stability-method-label';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { OverallScoreType, TestSuite } from '@/src/models/evaluation/test-suite';

const t = (key: string, values?: Record<string, string | number>) =>
  values ? `${key}:${JSON.stringify(values)}` : key;

describe('getStabilityMethodLabel', () => {
  test('returns null when suite overall is not a function', () => {
    expect(getStabilityMethodLabel({ overallScore: { type: OverallScoreType.Mean } } as TestSuite, 4, t)).toBeNull();
  });

  test('returns mean-of-N when test-case score is mean under ROC AUC', () => {
    const suite = {
      overallScore: { type: OverallScoreType.Function, expression: { entity: 'x', mode: 'aggregate' } },
      testCaseOverallScore: { type: OverallScoreType.Mean },
    } as TestSuite;

    expect(getStabilityMethodLabel(suite, 4, t)).toBe(
      `${TestSuitesI18nKey.TrendsMeanOfNMetrics}:${JSON.stringify({ count: 4 })}`,
    );
  });

  test('returns weighted-mean-of-N from test-case weights under ROC AUC', () => {
    const suite = {
      overallScore: { type: OverallScoreType.Function, expression: { entity: 'x', mode: 'aggregate' } },
      testCaseOverallScore: {
        type: OverallScoreType.WeightedMean,
        weights: [
          { metricName: 'a', outputField: 'score', weight: 0.5 },
          { metricName: 'b', outputField: 'score', weight: 0.5 },
        ],
      },
    } as TestSuite;

    expect(getStabilityMethodLabel(suite, 9, t)).toBe(
      `${TestSuitesI18nKey.TrendsWeightedMeanOfNMetrics}:${JSON.stringify({ count: 2 })}`,
    );
  });
});

import { describe, expect, test } from 'vitest';

import { getMetricStatisticDescriptionKey, sortMetricStatistics } from '@/src/components/Common/MetricStatistics/utils';
import { RunsI18nKey } from '@/src/constants/i18n';

describe('MetricStatistics utils', () => {
  test('sortMetricStatistics uses canonical segmented-control order', () => {
    expect(sortMetricStatistics(['MAX', 'MIN', 'MED', 'P90', 'AVG', 'CUSTOM'])).toEqual([
      'AVG',
      'P90',
      'MAX',
      'MED',
      'MIN',
      'CUSTOM',
    ]);
  });

  test('getMetricStatisticDescriptionKey returns known keys and undefined otherwise', () => {
    expect(getMetricStatisticDescriptionKey('AVG')).toBe(RunsI18nKey.MetricScoresDescriptionAvg);
    expect(getMetricStatisticDescriptionKey('UNKNOWN')).toBeUndefined();
    expect(getMetricStatisticDescriptionKey(null)).toBeUndefined();
  });
});

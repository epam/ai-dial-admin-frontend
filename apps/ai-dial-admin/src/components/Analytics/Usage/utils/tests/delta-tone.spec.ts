import { describe, expect, test } from 'vitest';

import { KpiMetric } from '@/src/components/Analytics/Usage/models';
import { DELTA_TONE_CLASS, DeltaTone, getDeltaTone } from '@/src/components/Analytics/Usage/utils/delta-tone';

describe('getDeltaTone', () => {
  test.each([KpiMetric.Requests, KpiMetric.Tokens, KpiMetric.UniqueUsers, KpiMetric.ToolCalls])(
    'reads a rise in %s as the welcome direction',
    (metric) => {
      expect(getDeltaTone(metric, 0.2)).toBe(DeltaTone.Good);
      expect(getDeltaTone(metric, -0.2)).toBe(DeltaTone.Bad);
    },
  );

  test.each([KpiMetric.TotalSpend, KpiMetric.CostPerMillionTokens, KpiMetric.ErrorRate, KpiMetric.AvgLatency])(
    'reads a rise in %s as the unwelcome direction',
    (metric) => {
      expect(getDeltaTone(metric, 0.2)).toBe(DeltaTone.Bad);
      expect(getDeltaTone(metric, -0.2)).toBe(DeltaTone.Good);
    },
  );

  test('passes no judgement on no change', () => {
    expect(getDeltaTone(KpiMetric.Requests, 0)).toBe(DeltaTone.Neutral);
  });

  test('passes no judgement when there is no change to read', () => {
    expect(getDeltaTone(KpiMetric.Requests, null)).toBe(DeltaTone.Neutral);
  });
});

describe('DELTA_TONE_CLASS', () => {
  test('maps every tone to a theme token rather than a literal colour', () => {
    expect(Object.values(DELTA_TONE_CLASS).every((className) => className.startsWith('text-'))).toBe(true);
  });
});

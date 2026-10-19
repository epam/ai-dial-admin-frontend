import { BadgeColor, BadgeVariant } from '@epam/ai-dial-ui-kit';
import { describe, expect, test } from 'vitest';

import { KpiMetric } from '@/src/components/Analytics/Usage/models';
import { DeltaTone, getDeltaBadgeAppearance, getDeltaTone } from '@/src/components/Analytics/Usage/utils/delta-tone';

describe('getDeltaTone', () => {
  test.each([KpiMetric.Requests, KpiMetric.Tokens, KpiMetric.UniqueCallers])(
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

describe('getDeltaBadgeAppearance', () => {
  test('fills a welcome change green', () => {
    expect(getDeltaBadgeAppearance(KpiMetric.Requests, 0.2)).toEqual({
      variant: BadgeVariant.Filled,
      color: BadgeColor.Green,
    });
  });

  test('fills an unwelcome change red', () => {
    expect(getDeltaBadgeAppearance(KpiMetric.TotalSpend, 0.2)).toEqual({
      variant: BadgeVariant.Filled,
      color: BadgeColor.Red,
    });
  });

  test('outlines a change it passes no judgement on', () => {
    expect(getDeltaBadgeAppearance(KpiMetric.Requests, 0)).toEqual({ variant: BadgeVariant.Outlined });
  });
});

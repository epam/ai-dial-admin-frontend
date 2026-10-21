import { describe, expect, test } from 'vitest';

import { DonutMetric, UsageView } from '@/src/components/Analytics/Usage/models';
import { getDefaultDonutMetric, isPricedView } from '@/src/components/Analytics/Usage/utils/views';

describe('isPricedView', () => {
  test('offers cost in the LLM view alone', () => {
    expect(isPricedView(UsageView.Llm)).toBe(true);
  });

  test.each([UsageView.Mcp, UsageView.Routes])('offers no cost in the %s view, whose rows carry no price', (view) => {
    expect(isPricedView(view)).toBe(false);
  });
});

describe('getDefaultDonutMetric', () => {
  test('opens the LLM view on cost', () => {
    expect(getDefaultDonutMetric(UsageView.Llm)).toBe(DonutMetric.Cost);
  });

  test.each([UsageView.Mcp, UsageView.Routes])('opens the %s view on calls, having no cost to split by', (view) => {
    expect(getDefaultDonutMetric(view)).toBe(DonutMetric.Calls);
  });
});

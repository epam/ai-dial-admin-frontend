import { describe, expect, test } from 'vitest';

import { UsageView } from '@/src/components/Analytics/Usage/models';
import { isPricedView } from '@/src/components/Analytics/Usage/utils/views';

describe('isPricedView', () => {
  test('offers cost in the LLM view alone', () => {
    expect(isPricedView(UsageView.Llm)).toBe(true);
  });

  test.each([UsageView.Mcp, UsageView.Routes])('offers no cost in the %s view, whose rows carry no price', (view) => {
    expect(isPricedView(view)).toBe(false);
  });
});

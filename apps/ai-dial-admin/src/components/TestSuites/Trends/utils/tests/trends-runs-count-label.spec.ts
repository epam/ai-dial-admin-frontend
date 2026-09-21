import { describe, expect, test } from 'vitest';

import { TRENDS_RUN_WINDOW } from '@/src/components/TestSuites/Trends/constants';
import {
  formatTrendsRunsCountLabel,
  getTrendsRunsCountI18nKey,
} from '@/src/components/TestSuites/Trends/utils/trends-runs-count-label';
import { TestSuitesI18nKey } from '@/src/constants/i18n';

describe('getTrendsRunsCountI18nKey', () => {
  test('uses plain runs count below the Trends window', () => {
    expect(getTrendsRunsCountI18nKey(TRENDS_RUN_WINDOW - 1)).toBe(TestSuitesI18nKey.TrendsRunsCount);
  });

  test('uses last-N label when the Trends window is full', () => {
    expect(getTrendsRunsCountI18nKey(TRENDS_RUN_WINDOW)).toBe(TestSuitesI18nKey.TrendsLastNRuns);
  });
});

describe('formatTrendsRunsCountLabel', () => {
  test('passes count into the selected key', () => {
    const t = (key: string, values?: Record<string, string | number>) => `${key}:${values?.count ?? ''}`;

    expect(formatTrendsRunsCountLabel(t, 3)).toBe(`${TestSuitesI18nKey.TrendsRunsCount}:3`);
    expect(formatTrendsRunsCountLabel(t, 10)).toBe(`${TestSuitesI18nKey.TrendsLastNRuns}:10`);
  });
});

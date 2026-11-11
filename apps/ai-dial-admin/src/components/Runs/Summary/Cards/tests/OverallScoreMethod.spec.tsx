import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { OverallScoreType } from '@/src/models/evaluation/test-suite';
import OverallScoreMethod from '../OverallScoreMethod';

// Unlike the shared mock, interpolates values so the label's wording can be asserted.
vi.mock('@/src/locales/client', () => {
  const t = (key: string, values?: Record<string, string | number>) =>
    values ? `${key}(${Object.values(values).join(',')})` : key;
  return { useI18n: () => t, useCurrentLocale: () => 'en' };
});

describe('OverallScoreMethod', () => {
  test('prefixes the method name, lower-cased, with "Based on"', () => {
    render(<OverallScoreMethod scoreMethod={{ type: OverallScoreType.Mean }} metricCount={3} />);

    expect(
      screen.getByText(`${TestSuitesI18nKey.TrendsBasedOnMethod}(testSuites.TrendsMeanOfNMetrics(3))`),
    ).toBeTruthy();
  });

  test('keeps the calculation method info control next to the label', () => {
    render(<OverallScoreMethod scoreMethod={{ type: OverallScoreType.Mean }} metricCount={3} />);

    expect(screen.getByRole('button', { name: TestSuitesI18nKey.OverallScoreCalculationMethod })).toBeTruthy();
  });
});

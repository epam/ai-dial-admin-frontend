import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import DeltaBadge from '@/src/components/Analytics/Usage/Delta/DeltaBadge';
import { KpiMetric } from '@/src/components/Analytics/Usage/models';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';

const renderBadge = (ratio: number) => render(<DeltaBadge ratio={ratio} metric={KpiMetric.Requests} />);

describe('DeltaBadge', () => {
  test('shows the magnitude without a sign', () => {
    renderBadge(-0.25);

    expect(screen.getByText('25.0%')).toBeTruthy();
  });

  test('spells a rise out for a screen reader', () => {
    renderBadge(0.25);

    expect(screen.getByText(AnalyticsUsageI18nKey.KpiDeltaIncrease)).toBeTruthy();
  });

  test('spells a fall out for a screen reader', () => {
    renderBadge(-0.25);

    expect(screen.getByText(AnalyticsUsageI18nKey.KpiDeltaDecrease)).toBeTruthy();
  });

  test('hides the visible badge from assistive tech, so the change is announced once', () => {
    const { container } = renderBadge(0.25);

    expect(container.querySelector('[aria-hidden="true"]')?.textContent).toBe('25.0%');
  });

  test('draws no arrow and names no direction for no change', () => {
    const { container } = renderBadge(0);

    expect(container.querySelector('svg')).toBeNull();
    expect(screen.queryByText(AnalyticsUsageI18nKey.KpiDeltaIncrease)).toBeNull();
    expect(screen.queryByText(AnalyticsUsageI18nKey.KpiDeltaDecrease)).toBeNull();
  });

  test('still announces the magnitude of no change', () => {
    const { container } = renderBadge(0);

    expect(container.querySelector('.sr-only')?.textContent).toBe('0.0%');
  });
});

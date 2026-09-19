import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import UsageControls from '@/src/components/Analytics/Usage/Controls/UsageControls';
import { ComparePeriod, UsageView } from '@/src/components/Analytics/Usage/models';
import { AnalyticsUsageI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';

const TIME_RANGE = {
  startDate: new Date('2026-09-16T00:00:00.000Z'),
  endDate: new Date('2026-09-17T00:00:00.000Z'),
};

type Props = Parameters<typeof UsageControls>[0];

const renderControls = (props: Partial<Props> = {}) =>
  render(
    <UsageControls
      view={UsageView.Llm}
      onViewChange={vi.fn()}
      compare={ComparePeriod.PreviousPeriod}
      onCompareChange={vi.fn()}
      timePeriod="last-24-hours"
      onTimePeriodChange={vi.fn()}
      timeRange={TIME_RANGE}
      onTimeRangeChange={vi.fn()}
      isRefreshing={false}
      onRefresh={vi.fn()}
      {...props}
    />,
  );

describe('UsageControls', () => {
  test('names the view and the comparison the page is reading under', () => {
    renderControls();

    expect(screen.getByRole('combobox', { name: AnalyticsUsageI18nKey.ViewByLabel })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: AnalyticsUsageI18nKey.CompareLabel })).toBeTruthy();
  });

  test('states the selected view and comparison in their own fields', () => {
    renderControls();

    const viewField = screen.getByRole('combobox', { name: AnalyticsUsageI18nKey.ViewByLabel }) as HTMLInputElement;
    const compareField = screen.getByRole('combobox', {
      name: AnalyticsUsageI18nKey.CompareLabel,
    }) as HTMLInputElement;

    expect(viewField.value).toContain(AnalyticsUsageI18nKey.ViewLlm);
    expect(compareField.value).toContain(AnalyticsUsageI18nKey.ComparePreviousPeriod);
  });

  test('re-reads every window from the refresh control', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    renderControls({ onRefresh });

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Refresh }));

    expect(onRefresh).toHaveBeenCalledOnce();
  });

  test('refuses a second refresh while one is still running', () => {
    renderControls({ isRefreshing: true });

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Refresh }).hasAttribute('disabled')).toBe(true);
  });

  test('switches the view from its option list', async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();
    renderControls({ onViewChange });

    await user.click(screen.getByRole('combobox', { name: AnalyticsUsageI18nKey.ViewByLabel }));
    await user.click(screen.getByRole('option', { name: AnalyticsUsageI18nKey.ViewMcp }));

    expect(onViewChange).toHaveBeenCalledWith(UsageView.Mcp);
  });

  test('turns the comparison off from its option list', async () => {
    const user = userEvent.setup();
    const onCompareChange = vi.fn();
    renderControls({ onCompareChange });

    await user.click(screen.getByRole('combobox', { name: AnalyticsUsageI18nKey.CompareLabel }));
    await user.click(screen.getByRole('option', { name: AnalyticsUsageI18nKey.CompareOff }));

    expect(onCompareChange).toHaveBeenCalledWith(ComparePeriod.Off);
  });
});

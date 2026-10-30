import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import { CompletionBreakdown } from '@/src/components/Runs/Summary/models';
import { ErrorI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import TestCasesCompletedValue from '../TestCasesCompletedValue';

const BREAKDOWN: CompletionBreakdown = { total: 55, completed: 45, above: 20, below: 25, errorOrNa: 10 };

describe('TestCasesCompletedValue', () => {
  test('shows the completed count, the total and the error line', () => {
    render(<TestCasesCompletedValue breakdown={BREAKDOWN} hasThreshold />);

    expect(screen.getByText('45')).toBeTruthy();
    expect(screen.getByText('/55')).toBeTruthy();
    expect(screen.getByText('10')).toBeTruthy();
    expect(screen.getByText(ErrorI18nKey.Error)).toBeTruthy();
  });

  test('hides the error line when no test case errored', () => {
    render(<TestCasesCompletedValue breakdown={{ ...BREAKDOWN, completed: 55, errorOrNa: 0 }} hasThreshold />);

    expect(screen.getByText('55', { selector: 'span.dial-display2-text' })).toBeTruthy();
    expect(screen.queryByText(ErrorI18nKey.Error)).toBeNull();
  });

  test('opens the full breakdown on hover when a threshold is set', async () => {
    const user = userEvent.setup();
    render(<TestCasesCompletedValue breakdown={BREAKDOWN} hasThreshold />);

    await user.hover(screen.getByText('45'));

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip.textContent).toContain(TestSuitesI18nKey.TrendsTotalTestCases);
    expect(tooltip.textContent).toContain('55');
    expect(tooltip.textContent).toContain(TestSuitesI18nKey.TrendsTestCasesCompleted);
    expect(tooltip.textContent).toContain(TestSuitesI18nKey.TrendsScoreAboveThreshold);
    expect(tooltip.textContent).toContain('20');
    expect(tooltip.textContent).toContain(TestSuitesI18nKey.TrendsScoreBelowThreshold);
    expect(tooltip.textContent).toContain('25');
    expect(tooltip.textContent).toContain(TestSuitesI18nKey.TrendsTestCasesErrorOrNa);
  });

  test('omits the above and below rows without a threshold', async () => {
    const user = userEvent.setup();
    render(<TestCasesCompletedValue breakdown={{ ...BREAKDOWN, above: 0, below: 0 }} hasThreshold={false} />);

    await user.hover(screen.getByText('45'));

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip.textContent).toContain(TestSuitesI18nKey.TrendsTestCasesCompleted);
    expect(tooltip.textContent).not.toContain(TestSuitesI18nKey.TrendsScoreAboveThreshold);
    expect(tooltip.textContent).not.toContain(TestSuitesI18nKey.TrendsScoreBelowThreshold);
  });

  test('opens the same tooltip from the keyboard', async () => {
    const user = userEvent.setup();
    render(<TestCasesCompletedValue breakdown={BREAKDOWN} hasThreshold />);

    await user.tab();

    expect((await screen.findByRole('tooltip')).textContent).toContain(TestSuitesI18nKey.TrendsTotalTestCases);
  });

  test('heads the tooltip with the run name in compare mode', async () => {
    const user = userEvent.setup();
    render(<TestCasesCompletedValue breakdown={BREAKDOWN} hasThreshold tooltipTitle="Run #316" />);

    await user.hover(screen.getByText('45'));

    expect((await screen.findByRole('tooltip')).textContent).toContain('Run #316');
  });

  test('shows a dash when the run has no test cases', () => {
    render(
      <TestCasesCompletedValue breakdown={{ total: 0, completed: 0, above: 0, below: 0, errorOrNa: 0 }} hasThreshold />,
    );

    expect(screen.getByText('—')).toBeTruthy();
    expect(screen.queryByText(ErrorI18nKey.Error)).toBeNull();
  });
});

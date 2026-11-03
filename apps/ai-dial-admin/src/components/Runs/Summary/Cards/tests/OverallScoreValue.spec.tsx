import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { OverallScoreType, TestSuite } from '@/src/models/evaluation/test-suite';
import OverallScoreValue from '../OverallScoreValue';

const MEAN_SUITE: TestSuite = { id: 'suite-1', overallScore: { type: OverallScoreType.Mean } };

describe('OverallScoreValue', () => {
  test('formats the score with three decimals', () => {
    render(<OverallScoreValue score={0.58} />);

    expect(screen.getByText('0.580')).toBeTruthy();
  });

  test('shows no glyph or tooltip without a threshold', async () => {
    const user = userEvent.setup();
    const { container } = render(<OverallScoreValue score={0.58} threshold={null} />);

    await user.hover(screen.getByText('0.580'));

    expect(container.querySelector('.bg-score-abs-11')).toBeNull();
    expect(container.querySelector('.bg-score-abs-00')).toBeNull();
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  test('shows the above glyph and tooltip when the score is over the threshold', async () => {
    const user = userEvent.setup();
    const { container } = render(<OverallScoreValue score={0.812} threshold={0.6} />);

    await user.hover(screen.getByText('0.812'));

    expect(container.querySelector('.bg-score-abs-11')).toBeTruthy();
    expect((await screen.findByRole('tooltip')).textContent).toContain(
      TestSuitesI18nKey.TrendsOverallScoreAboveThresholdTooltip,
    );
  });

  test('counts a score exactly at the threshold as above', () => {
    const { container } = render(<OverallScoreValue score={0.6} threshold={0.6} />);

    expect(container.querySelector('.bg-score-abs-11')).toBeTruthy();
    expect(container.querySelector('.bg-score-abs-00')).toBeNull();
  });

  test('shows the below glyph and tooltip when the score is under the threshold', async () => {
    const user = userEvent.setup();
    const { container } = render(<OverallScoreValue score={0.58} threshold={0.6} />);

    await user.hover(screen.getByText('0.580'));

    expect(container.querySelector('.bg-score-abs-00')).toBeTruthy();
    expect((await screen.findByRole('tooltip')).textContent).toContain(
      TestSuitesI18nKey.TrendsOverallScoreBelowThresholdTooltip,
    );
  });

  test('treats a threshold of zero as set', () => {
    const { container } = render(<OverallScoreValue score={0.1} threshold={0} />);

    expect(container.querySelector('.bg-score-abs-11')).toBeTruthy();
  });

  test('exposes the threshold state to assistive technology as text', () => {
    render(<OverallScoreValue score={0.58} threshold={0.6} />);

    expect(screen.getByText(TestSuitesI18nKey.TrendsOverallScoreBelowThresholdTooltip)).toBeTruthy();
  });

  test('shows a dash without a score', () => {
    render(<OverallScoreValue score={null} threshold={0.6} />);

    expect(screen.getByText('—')).toBeTruthy();
  });

  test('renders the info control after the score when inline and the suite has loaded', async () => {
    const user = userEvent.setup();
    render(<OverallScoreValue score={0.58} isInfoInline testSuite={MEAN_SUITE} metricCount={4} />);

    await user.hover(screen.getByRole('button', { name: TestSuitesI18nKey.OverallScoreCalculationMethod }));

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip.textContent).toContain(TestSuitesI18nKey.OverallScoreCalculationMethod);
    expect(tooltip.textContent).toContain(TestSuitesI18nKey.TrendsMeanOfNMetrics);
  });

  test('omits the inline info control until the suite has loaded', () => {
    render(<OverallScoreValue score={0.58} isInfoInline testSuite={null} />);

    expect(screen.queryByRole('button', { name: TestSuitesI18nKey.OverallScoreCalculationMethod })).toBeNull();
  });

  test('leaves the info control to the card when not inline', () => {
    render(<OverallScoreValue score={0.58} testSuite={MEAN_SUITE} />);

    expect(screen.queryByRole('button', { name: TestSuitesI18nKey.OverallScoreCalculationMethod })).toBeNull();
  });
});

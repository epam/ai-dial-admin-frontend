import { render, screen } from '@testing-library/react';
import type { ICellRendererParams } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import { RunsI18nKey } from '@/src/constants/i18n';
import OverallScoreCellRenderer from '../OverallScoreCellRenderer';

const renderScore = (value: unknown, threshold?: number | null) =>
  render(<OverallScoreCellRenderer {...({ value, threshold } as unknown as ICellRendererParams)} />);

describe('OverallScoreCellRenderer', () => {
  test('exposes the score and the above-threshold message as one group', () => {
    renderScore(0.7, 0.6);

    expect(
      screen.getByRole('group', { name: `0.7. ${RunsI18nKey.TestCaseOverallScoreAboveThresholdTooltip}` }),
    ).toBeInTheDocument();
  });

  test('exposes the below-threshold message for a lower score', () => {
    renderScore(0.5, 0.6);

    expect(
      screen.getByRole('group', { name: `0.5. ${RunsI18nKey.TestCaseOverallScoreBelowThresholdTooltip}` }),
    ).toBeInTheDocument();
  });

  test('counts a score equal to the threshold as above', () => {
    renderScore(0.6, 0.6);

    expect(screen.getByRole('group', { name: /TestCaseOverallScoreAboveThresholdTooltip/ })).toBeInTheDocument();
  });

  test('shows a zero score with the below-threshold result', () => {
    renderScore(0, 0.6);

    expect(screen.getByRole('group', { name: /^0\. .*TestCaseOverallScoreBelowThresholdTooltip/ })).toBeInTheDocument();
  });

  test('shows the value without a group or icon when the suite has no threshold', () => {
    const { container } = renderScore(0.7);

    expect(screen.getByText('0.7')).toBeInTheDocument();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  test('treats an enabled-but-empty threshold as no threshold', () => {
    renderScore(0.7, null);

    expect(screen.getByText('0.7')).toBeInTheDocument();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  test.each([[undefined], [null], [Number.NaN], ['—']])('shows a dash and no icon for %s', (value) => {
    const { container } = renderScore(value, 0.6);

    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });
});

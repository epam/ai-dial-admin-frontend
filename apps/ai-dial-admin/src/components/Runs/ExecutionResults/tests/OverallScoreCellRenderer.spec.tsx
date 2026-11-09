import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import OverallScoreCellRenderer from '@/src/components/Runs/ExecutionResults/OverallScoreCellRenderer';
import { TestCaseThresholdStatus } from '@/src/components/Runs/ExecutionResults/models';
import { RunsI18nKey } from '@/src/constants/i18n';

describe('OverallScoreCellRenderer', () => {
  test.each([
    [TestCaseThresholdStatus.Pass, RunsI18nKey.Above, 'bg-score-abs-11', '.tabler-icon-chevrons-up'],
    [TestCaseThresholdStatus.Fail, RunsI18nKey.Below, 'bg-score-abs-00', '.tabler-icon-chevrons-down'],
  ])('renders the numeric score with the shared %s threshold badge', (status, label, className, iconSelector) => {
    const { container } = render(
      <OverallScoreCellRenderer {...({ value: { score: 0.75, thresholdStatus: status } } as any)} />,
    );

    expect(screen.getByRole('group', { name: `0.750, ${label}` })).toBeInTheDocument();
    expect(screen.getByText('0.750')).toBeInTheDocument();
    expect(container.querySelector(`.${className}`)).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector(iconSelector)).toHaveClass(className.replace('bg-', 'text-'));
  });

  test('keeps the neutral indicator for an unavailable score instead of showing a threshold badge', () => {
    const { container } = render(
      <OverallScoreCellRenderer
        {...({ value: { score: 'N/A', thresholdStatus: TestCaseThresholdStatus.NotApplicable } } as any)}
      />,
    );

    expect(screen.getByRole('group', { name: `N/A, ${RunsI18nKey.NotApplicable}` })).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
    expect(container.querySelector('.tabler-icon-minus')).toHaveClass('text-secondary');
    expect(container.querySelector('.bg-score-abs-11, .bg-score-abs-00')).toBeNull();
  });

  test('shows the below-threshold badge for a zero score', () => {
    const { container } = render(
      <OverallScoreCellRenderer {...({ value: { score: 0, thresholdStatus: TestCaseThresholdStatus.Fail } } as any)} />,
    );

    expect(screen.getByRole('group', { name: `0.000, ${RunsI18nKey.Below}` })).toBeInTheDocument();
    expect(container.querySelector('.bg-score-abs-00')).toBeTruthy();
  });

  test('renders only the numeric score when no threshold is configured', () => {
    const { container } = render(<OverallScoreCellRenderer {...({ value: { score: 0.75 } } as any)} />);

    expect(screen.getByRole('group', { name: '0.750' })).toBeInTheDocument();
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  test('renders no score when the row has no overall score value', () => {
    const { container } = render(<OverallScoreCellRenderer {...({ value: undefined } as any)} />);

    expect(container).toBeEmptyDOMElement();
  });
});

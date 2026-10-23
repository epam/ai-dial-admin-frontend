import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import OverallScoreCellRenderer from '@/src/components/Runs/ExecutionResults/OverallScoreCellRenderer';
import { TestCaseThresholdStatus } from '@/src/components/Runs/ExecutionResults/models';
import { RunsI18nKey } from '@/src/constants/i18n';

describe('OverallScoreCellRenderer', () => {
  test.each([
    [TestCaseThresholdStatus.Pass, RunsI18nKey.Above, 'text-success', '.tabler-icon-arrow-up'],
    [TestCaseThresholdStatus.Fail, RunsI18nKey.Below, 'text-error', '.tabler-icon-arrow-down'],
    [TestCaseThresholdStatus.NotApplicable, RunsI18nKey.NotApplicable, 'text-secondary', '.tabler-icon-minus'],
  ])('renders the numeric score with its %s threshold indicator', (status, label, className, iconSelector) => {
    const { container } = render(
      <OverallScoreCellRenderer {...({ value: { score: 0.75, thresholdStatus: status } } as any)} />,
    );

    expect(screen.getByRole('group', { name: `0.750, ${label}` })).toBeInTheDocument();
    expect(screen.getByText('0.750')).toBeInTheDocument();
    expect(container.querySelector(iconSelector)).toHaveClass(className);
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

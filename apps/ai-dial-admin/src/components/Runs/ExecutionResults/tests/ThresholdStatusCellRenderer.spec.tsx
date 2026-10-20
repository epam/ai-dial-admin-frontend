import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import ThresholdStatusCellRenderer from '@/src/components/Runs/ExecutionResults/ThresholdStatusCellRenderer';
import { TestCaseThresholdStatus } from '@/src/components/Runs/ExecutionResults/models';
import { RunsI18nKey } from '@/src/constants/i18n';

describe('ThresholdStatusCellRenderer', () => {
  test.each([
    [TestCaseThresholdStatus.Pass, RunsI18nKey.Above, 'text-success', '.tabler-icon-arrow-up'],
    [TestCaseThresholdStatus.Fail, RunsI18nKey.Below, 'text-error', '.tabler-icon-arrow-down'],
    [TestCaseThresholdStatus.NotApplicable, RunsI18nKey.NotApplicable, 'text-secondary', '.tabler-icon-minus'],
  ])('renders %s group status', (status, label, className, iconSelector) => {
    const { container } = render(<ThresholdStatusCellRenderer {...({ value: status } as any)} />);

    expect(screen.getByText(label)).toHaveClass(className);
    expect(container.querySelector(iconSelector)).toBeTruthy();
  });

  test('renders no status when the row has no threshold value', () => {
    const { container } = render(<ThresholdStatusCellRenderer {...({ value: undefined } as any)} />);

    expect(container).toBeEmptyDOMElement();
  });
});

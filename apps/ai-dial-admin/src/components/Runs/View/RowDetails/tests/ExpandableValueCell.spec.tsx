import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { RowDetailField } from '@/src/components/Runs/Details/RowDetails/models';
import { RunsI18nKey } from '@/src/constants/i18n';
import ExpandableValueCell from '../ExpandableValueCell';

const field = (overrides: Partial<RowDetailField> = {}): RowDetailField => ({
  fieldKey: 'answer',
  label: 'answer',
  primaryRaw: 'a long value',
  secondaryRaw: null,
  diffKind: MetricDeltaKind.Empty,
  isNumeric: false,
  isScoreIndicator: false,
  isMetric: false,
  ...overrides,
});

describe('ExpandableValueCell', () => {
  const renderCell = (overrides?: Partial<RowDetailField>, onOpen = vi.fn()) => {
    render(<ExpandableValueCell field={field(overrides)} onOpen={onOpen} />);
    return onOpen;
  };

  const getOpenButton = () => screen.getByRole('button', { name: RunsI18nKey.OpenFullValue });

  test('clamps the value to three lines', () => {
    renderCell();

    expect(screen.getByText('a long value')).toHaveClass('line-clamp-3');
  });

  test('is a button naming the field, whether or not the value is truncated', () => {
    renderCell({ primaryRaw: 'short' });

    expect(getOpenButton()).toHaveAttribute('aria-haspopup', 'dialog');
  });

  test('opens the field when the button is clicked', async () => {
    const user = userEvent.setup();
    const onOpen = renderCell({ label: 'Answer' });

    await user.click(getOpenButton());

    expect(onOpen).toHaveBeenCalledOnce();
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ label: 'Answer', primaryRaw: 'a long value' }));
  });

  test('opens with Enter and Space from the keyboard', async () => {
    const user = userEvent.setup();
    const onOpen = renderCell();

    await user.tab();
    expect(getOpenButton()).toHaveFocus();

    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onOpen).toHaveBeenCalledTimes(2);
  });

  test('keeps the open icon out of the accessibility tree', () => {
    renderCell();

    expect(getOpenButton().querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  test('makes a missing value clickable too', async () => {
    const user = userEvent.setup();
    const onOpen = renderCell({ primaryRaw: null });

    await user.click(getOpenButton());

    expect(onOpen).toHaveBeenCalledOnce();
  });

  test('makes a score cell a button and keeps its heat-map fill unpadded', () => {
    renderCell({ fieldKey: 'Accuracy_precision', isMetric: true, isScoreIndicator: true, primaryRaw: '0.8' });

    expect(screen.getByText('0.800')).toBeTruthy();
    expect(getOpenButton()).toBeInTheDocument();
    expect(getOpenButton().parentElement).toHaveClass('p-0');
  });

  test('opens a metric field as the field itself, so the score popup can be chosen', async () => {
    const user = userEvent.setup();
    const onOpen = renderCell({ isMetric: true, isScoreIndicator: true, primaryRaw: '0.8' });

    await user.click(getOpenButton());

    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ isMetric: true }));
  });

  test('makes the execution status cell a button', () => {
    renderCell({ fieldKey: 'executionStatus', label: 'executionStatus', primaryRaw: 'COMPLETED' });

    expect(getOpenButton()).toBeInTheDocument();
  });

  test('shows the failed label for a failed metric and keeps the cell clickable', () => {
    renderCell({ isMetric: true, primaryFailed: true, primaryRaw: null });

    expect(screen.getByText(RunsI18nKey.MetricFailedText)).toBeTruthy();
    expect(getOpenButton()).toBeInTheDocument();
  });
});

describe('ExpandableValueCell overall score threshold', () => {
  test('shows the above-threshold icon after the value', () => {
    const { container } = render(
      <ExpandableValueCell
        field={field({ fieldKey: 'overallScore', primaryRaw: '0.7', isNumeric: true, primaryThreshold: 0.6 })}
        onOpen={vi.fn()}
      />,
    );

    expect(screen.getByText('Runs.TestCaseOverallScoreAboveThresholdTooltip')).toBeInTheDocument();
    expect(container.querySelector('svg.text-score-abs-11')).toBeInTheDocument();
  });

  test('shows the below-threshold icon for a lower score and none without a threshold', () => {
    const { container, rerender } = render(
      <ExpandableValueCell
        field={field({ fieldKey: 'overallScore', primaryRaw: '0', isNumeric: true, primaryThreshold: 0.6 })}
        onOpen={vi.fn()}
      />,
    );
    expect(container.querySelector('svg.text-score-abs-00')).toBeInTheDocument();

    rerender(
      <ExpandableValueCell
        field={field({ fieldKey: 'overallScore', primaryRaw: '0', isNumeric: true })}
        onOpen={vi.fn()}
      />,
    );
    expect(container.querySelector('svg.text-score-abs-00')).not.toBeInTheDocument();
  });
});

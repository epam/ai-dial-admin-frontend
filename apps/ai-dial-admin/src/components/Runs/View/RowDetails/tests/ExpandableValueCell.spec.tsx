import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';

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

const mockOverflow = (isOverflowing: boolean) => {
  vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(isOverflowing ? 100 : 20);
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(60);
};

describe('ExpandableValueCell', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderCell = (overrides?: Partial<RowDetailField>, onOpen = vi.fn()) => {
    render(<ExpandableValueCell field={field(overrides)} onOpen={onOpen} />);
    return onOpen;
  };

  test('clamps the value to three lines', () => {
    renderCell();

    expect(screen.getByText('a long value')).toHaveClass('line-clamp-3');
  });

  test('is not interactive when the value fits', () => {
    mockOverflow(false);
    renderCell();

    expect(screen.queryByRole('button')).toBeNull();
  });

  test('becomes a button naming the field when the value is truncated', () => {
    mockOverflow(true);
    renderCell();

    expect(screen.getByRole('button', { name: RunsI18nKey.OpenFullValue })).toHaveAttribute('aria-haspopup', 'dialog');
  });

  test('opens the field when the button is clicked', async () => {
    const user = userEvent.setup();
    mockOverflow(true);
    const onOpen = renderCell({ label: 'Answer' });

    await user.click(screen.getByRole('button', { name: RunsI18nKey.OpenFullValue }));

    expect(onOpen).toHaveBeenCalledOnce();
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ label: 'Answer', primaryRaw: 'a long value' }));
  });

  test('opens with Enter and Space from the keyboard', async () => {
    const user = userEvent.setup();
    mockOverflow(true);
    const onOpen = renderCell();

    await user.tab();
    expect(screen.getByRole('button', { name: RunsI18nKey.OpenFullValue })).toHaveFocus();

    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onOpen).toHaveBeenCalledTimes(2);
  });

  test('keeps the open icon out of the accessibility tree', () => {
    mockOverflow(true);
    renderCell();

    const button = screen.getByRole('button', { name: RunsI18nKey.OpenFullValue });
    expect(button.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  test('never makes a score cell a button', () => {
    mockOverflow(true);
    renderCell({ fieldKey: 'Accuracy_precision', isMetric: true, isScoreIndicator: true, primaryRaw: '0.8' });

    expect(screen.getByText('0.800')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('never makes the execution status cell a button', () => {
    mockOverflow(true);
    renderCell({ fieldKey: 'executionStatus', label: 'executionStatus', primaryRaw: 'COMPLETED' });

    expect(screen.queryByRole('button')).toBeNull();
  });

  test('shows the failed label for a failed metric without a button', () => {
    mockOverflow(true);
    renderCell({ isMetric: true, primaryFailed: true, primaryRaw: null });

    expect(screen.getByText(RunsI18nKey.MetricFailedText)).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});

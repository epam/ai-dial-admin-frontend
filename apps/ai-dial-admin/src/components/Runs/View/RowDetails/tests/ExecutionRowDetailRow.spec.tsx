import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { RowDetailField } from '@/src/components/Runs/Details/RowDetails/models';
import ExecutionRowDetailRow from '../ExecutionRowDetailRow';

vi.mock('@/src/components/Runs/Details/RowDetails/FieldValue', () => ({
  default: ({ raw, onOverflowChange }: { raw: string | null; onOverflowChange?: (value: boolean) => void }) => {
    onOverflowChange?.(raw != null && raw.length > 10);
    return <span>{raw ?? '—'}</span>;
  },
}));

vi.mock('@/src/components/Runs/Details/RowDetails/StatusValue', () => ({
  default: ({ raw }: { raw: string | null }) => <span data-testid="status-value">{raw}</span>,
}));

const field = (overrides: Partial<RowDetailField> = {}): RowDetailField => ({
  fieldKey: 'answer',
  label: 'answer',
  primaryRaw: 'Romans',
  secondaryRaw: null,
  diffKind: MetricDeltaKind.Empty,
  isNumeric: false,
  isScoreIndicator: false,
  isMetric: false,
  ...overrides,
});

const renderRow = (row: RowDetailField, onOpenFullValue = vi.fn()) =>
  render(
    <ExecutionRowDetailRow
      row={row}
      failedLabel="failed"
      openFullValueLabel="open-full-value"
      onOpenFullValue={onOpenFullValue}
    />,
  );

describe('ExecutionRowDetailRow', () => {
  test('renders the label cell with the field anchor and the value', () => {
    renderRow(field());

    expect(document.querySelector('[data-field-key="answer"]')).toBeTruthy();
    expect(screen.getByText('Romans')).toBeInTheDocument();
  });

  test('renders the status badge for the execution status field', () => {
    renderRow(field({ fieldKey: 'executionStatus', label: 'Execution Status', primaryRaw: 'SUCCESS' }));

    expect(screen.getByTestId('status-value')).toHaveTextContent('SUCCESS');
  });

  test('right-aligns numeric values', () => {
    const { container } = renderRow(
      field({ fieldKey: 'httpStatusCode', label: 'HTTP', primaryRaw: '200', isNumeric: true }),
    );

    expect(container.querySelector('.text-right')).toBeTruthy();
  });

  test('offers no open control for a short value', () => {
    renderRow(field({ primaryRaw: 'short' }));

    expect(screen.queryByRole('button', { name: 'open-full-value' })).not.toBeInTheDocument();
  });

  test('offers an open control for a clipped value that passes the row to the handler', async () => {
    const onOpenFullValue = vi.fn();
    const row = field({ primaryRaw: 'a value that is clearly too long' });
    renderRow(row, onOpenFullValue);

    await userEvent.click(screen.getByRole('button', { name: 'open-full-value' }));

    expect(onOpenFullValue).toHaveBeenCalledWith(row);
  });
});

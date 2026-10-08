import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { RowDetailField } from '@/src/components/Runs/Details/RowDetails/models';
import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import PivotValueCell from '../PivotValueCell';

vi.mock('@/src/components/Runs/View/RowDetails/FullscreenValueViewer', () => ({
  default: ({ fieldLabel, value }: { fieldLabel: string; value: string }) => (
    <div role="dialog" aria-label={fieldLabel}>
      {value}
    </div>
  ),
}));

const field = (fieldKey: string, overrides: Partial<RowDetailField> = {}): RowDetailField => ({
  fieldKey,
  label: fieldKey,
  primaryRaw: '200',
  secondaryRaw: null,
  diffKind: MetricDeltaKind.Empty,
  isNumeric: true,
  isScoreIndicator: false,
  isMetric: false,
  ...overrides,
});

describe('PivotValueCell', () => {
  test('right-aligns the HTTP field', () => {
    render(<PivotValueCell field={field('httpStatusCode')} />);

    expect(screen.getByRole('button')).toHaveClass('justify-end', 'text-right');
  });

  test('right-aligns the run number field', () => {
    render(<PivotValueCell field={field('runNumber', { isNumeric: false })} />);

    expect(screen.getByRole('button')).toHaveClass('justify-end', 'text-right');
  });

  test('right-aligns the duration field', () => {
    render(<PivotValueCell field={field('execDurationMs')} />);

    expect(screen.getByRole('button')).toHaveClass('justify-end', 'text-right');
  });

  test('right-aligns a metric field rendered as a ScoreBar', () => {
    render(<PivotValueCell field={field('Accuracy_precision', { isScoreIndicator: true, primaryRaw: '0.8' })} />);

    expect(screen.getByRole('button')).toHaveClass('justify-end', 'text-right');
  });

  test('leaves an unrelated field left-aligned, even a numeric one', () => {
    render(<PivotValueCell field={field('score')} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-left');
    expect(button).not.toHaveClass('justify-end');
  });

  test('keeps the open-popup action working for a long value', async () => {
    const longValue = 'x'.repeat(2000);
    render(<PivotValueCell field={field('responseBody')} raw={longValue} />);

    await userEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('dialog', { name: 'responseBody' })).toHaveTextContent(longValue);
  });

  test('calls onOpenFullscreen instead of the default popup when provided', async () => {
    const onOpenFullscreen = vi.fn();
    const longValue = 'x'.repeat(2000);
    render(<PivotValueCell field={field('responseBody')} raw={longValue} onOpenFullscreen={onOpenFullscreen} />);

    await userEvent.click(screen.getByRole('button'));

    expect(onOpenFullscreen).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

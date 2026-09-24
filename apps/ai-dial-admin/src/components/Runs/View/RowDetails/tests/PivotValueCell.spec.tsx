import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { RowDetailField } from '@/src/components/Runs/Details/RowDetails/models';
import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import PivotValueCell from '../PivotValueCell';

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

  test('leaves an unrelated field left-aligned, even a numeric one', () => {
    render(<PivotValueCell field={field('score')} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-left');
    expect(button).not.toHaveClass('justify-end');
  });
});

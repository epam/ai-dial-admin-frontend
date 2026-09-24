import { render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import DetailRow from '../DetailRow';
import { RowDetailField } from '@/src/components/Runs/Details/RowDetails/models';
import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';

const row = (fieldKey: string, overrides: Partial<RowDetailField> = {}): RowDetailField => ({
  fieldKey,
  label: fieldKey,
  primaryRaw: '200',
  secondaryRaw: '404',
  diffKind: MetricDeltaKind.Empty,
  isNumeric: true,
  isScoreIndicator: false,
  isMetric: false,
  ...overrides,
});

const renderDetailRow = (fieldRow: RowDetailField) =>
  render(
    <DetailRow
      row={fieldRow}
      hasComparedMatch
      noMatchLabel="No match"
      failedLabel="Failed"
      onOpenDiff={vi.fn()}
      openDiffLabel="Open diff"
      hideHighlights={false}
    />,
  );

const getValueCells = (container: HTMLElement, fieldKey: string) =>
  Array.from(container.querySelectorAll(`[data-field-key="${fieldKey}"] ~ div`)).slice(0, 2);

describe('DetailRow alignment', () => {
  test('right-aligns the HTTP field value cells', () => {
    const { container } = renderDetailRow(row('httpStatusCode'));
    const [primary, secondary] = getValueCells(container, 'httpStatusCode');

    expect(primary).toHaveClass('text-right');
    expect(secondary).toHaveClass('text-right');
  });

  test('right-aligns the run number field even though it is not flagged isNumeric', () => {
    const { container } = renderDetailRow(row('runNumber', { isNumeric: false }));
    const [primary] = getValueCells(container, 'runNumber');

    expect(primary).toHaveClass('text-right');
  });

  test('right-aligns the duration field', () => {
    const { container } = renderDetailRow(row('execDurationMs'));
    const [primary] = getValueCells(container, 'execDurationMs');

    expect(primary).toHaveClass('text-right');
  });

  test('leaves an unrelated field left-aligned, even a numeric one', () => {
    const { container } = renderDetailRow(row('score'));
    const [primary] = getValueCells(container, 'score');

    expect(primary).not.toHaveClass('text-right');
  });
});

import { render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import DetailRow from '../DetailRow';
import { getCompareRuns } from '@/src/components/Runs/Compare/utils';
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

const runs = getCompareRuns({ id: 'run-1', name: 'Run A' }, { id: 'run-2', name: 'Run B' });

const renderDetailRow = (fieldRow: RowDetailField, displayedRuns = runs) =>
  render(
    <DetailRow
      row={fieldRow}
      hasComparedMatch
      noMatchLabel="No match"
      failedLabel="Failed"
      onOpenDiff={vi.fn()}
      openDiffLabel="Open diff"
      hideHighlights={false}
      runs={displayedRuns}
    />,
  );

const getValueCells = (container: HTMLElement, fieldKey: string) =>
  Array.from(container.querySelectorAll(`[data-field-key="${fieldKey}"] ~ div`)).slice(0, 2);

const getDeltaCell = (container: HTMLElement, fieldKey: string) =>
  Array.from(container.querySelectorAll(`[data-field-key="${fieldKey}"] ~ div`))[2];

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

  test('right-aligns a metric field rendered as a ScoreBar', () => {
    const { container } = renderDetailRow(
      row('Accuracy_precision', { isScoreIndicator: true, primaryRaw: '0.8', secondaryRaw: '0.6' }),
    );
    const [primary, secondary] = getValueCells(container, 'Accuracy_precision');

    expect(primary.querySelector('.justify-end')).toBeTruthy();
    expect(secondary.querySelector('.justify-end')).toBeTruthy();
  });

  test('leaves an unrelated field left-aligned, even a numeric one', () => {
    const { container } = renderDetailRow(row('score'));
    const [primary] = getValueCells(container, 'score');

    expect(primary).not.toHaveClass('text-right');
  });

  test('right-aligns the delta cell for a numeric metric field', () => {
    const { container } = renderDetailRow(
      row('Accuracy_precision', { isNumeric: true, isMetric: true, primaryRaw: '0.8', secondaryRaw: '0.6' }),
    );

    expect(getDeltaCell(container, 'Accuracy_precision')).toHaveClass('text-right');
  });

  test('does not right-align the delta cell for a non-metric field', () => {
    const { container } = renderDetailRow(row('httpStatusCode', { isNumeric: true, isMetric: false }));

    expect(getDeltaCell(container, 'httpStatusCode')).not.toHaveClass('text-right');
  });
});

describe('DetailRow run order', () => {
  const getValueTexts = (container: HTMLElement) => getValueCells(container, 'answer').map((cell) => cell.textContent);

  test('renders the values in the order of the runs it is given', () => {
    const answer = row('answer', { primaryRaw: 'Berlin', secondaryRaw: 'Paris', isNumeric: false });

    expect(getValueTexts(renderDetailRow(answer).container)).toEqual(['Berlin', 'Paris']);
    expect(getValueTexts(renderDetailRow(answer, [...runs].reverse()).container)).toEqual(['Paris', 'Berlin']);
  });

  test('shows the no-match label on the secondary run wherever it is displayed', () => {
    const answer = row('answer', { primaryRaw: 'Berlin', secondaryRaw: null, isNumeric: false });
    const { container } = render(
      <DetailRow
        row={answer}
        hasComparedMatch={false}
        noMatchLabel="No match"
        failedLabel="Failed"
        onOpenDiff={vi.fn()}
        openDiffLabel="Open diff"
        hideHighlights={false}
        runs={[...runs].reverse()}
      />,
    );

    expect(getValueTexts(container)).toEqual(['No match', 'Berlin']);
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import CompareRowDetailTable from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareRowDetailTable';
import { getCompareRuns } from '@/src/components/Runs/Compare/utils';
import { RowDetailSection } from '@/src/components/Runs/Details/RowDetails/models';
import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { scrollPivotToField } from '@/src/components/Runs/Details/RowDetails/utils/scroll-pivot-to-field';

vi.mock('@/src/components/Runs/Details/RowDetails/utils/scroll-pivot-to-field', () => ({
  scrollPivotToField: vi.fn(),
}));

const sections: RowDetailSection[] = [
  {
    key: 'extractedColumns',
    label: 'Extracted',
    rows: [
      {
        fieldKey: 'answer',
        label: 'answer',
        primaryRaw: 'Berlin',
        secondaryRaw: 'Paris',
        diffKind: MetricDeltaKind.Changed,
        isNumeric: false,
        isScoreIndicator: false,
        isMetric: false,
      },
    ],
  },
];

const runs = getCompareRuns({ id: 'run-1', name: 'Run A' }, { id: 'run-2', name: 'Run B' });

describe('CompareRowDetailTable', () => {
  test('renders field anchors and scrolls to focusFieldKey', async () => {
    render(
      <CompareRowDetailTable
        sections={sections}
        runs={runs}
        hasComparedMatch
        showDiffsOnly={false}
        hideHighlights={false}
        focusFieldKey="answer"
      />,
    );

    expect(document.querySelector('[data-field-key="answer"]')).toBeTruthy();
    await vi.waitFor(() => expect(scrollPivotToField).toHaveBeenCalledWith(expect.any(HTMLElement), 'answer'));
  });

  test('re-scrolls when focusRequestId changes for the same field', async () => {
    vi.mocked(scrollPivotToField).mockClear();

    const { rerender } = render(
      <CompareRowDetailTable
        sections={sections}
        runs={runs}
        hasComparedMatch
        showDiffsOnly={false}
        hideHighlights={false}
        focusFieldKey="answer"
        focusRequestId={1}
      />,
    );

    await vi.waitFor(() => expect(scrollPivotToField).toHaveBeenCalledOnce());

    rerender(
      <CompareRowDetailTable
        sections={sections}
        runs={runs}
        hasComparedMatch
        showDiffsOnly={false}
        hideHighlights={false}
        focusFieldKey="answer"
        focusRequestId={2}
      />,
    );

    await vi.waitFor(() => expect(scrollPivotToField).toHaveBeenCalledTimes(2));
  });

  describe('run order', () => {
    const flippedRuns = [...runs].reverse();
    const renderTable = (displayedRuns = runs) =>
      render(
        <CompareRowDetailTable
          sections={sections}
          runs={displayedRuns}
          hasComparedMatch
          showDiffsOnly={false}
          hideHighlights={false}
        />,
      );

    test('lays out headers and values in the order of the runs', () => {
      renderTable(flippedRuns);

      expect(
        screen.getByText('Run B').compareDocumentPosition(screen.getByText('Run A')) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(
        screen.getByText('Paris').compareDocumentPosition(screen.getByText('Berlin')) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    test('a value filter stays with its run when the order flips', () => {
      const getSearchInputs = () => screen.getAllByRole('textbox');
      const { rerender } = renderTable();

      // The first value column filters Run A (primary): "Berlin" matches its value.
      fireEvent.change(getSearchInputs()[1], { target: { value: 'Berlin' } });
      expect(document.querySelector('[data-field-key="answer"]')).toBeTruthy();

      rerender(
        <CompareRowDetailTable
          sections={sections}
          runs={flippedRuns}
          hasComparedMatch
          showDiffsOnly={false}
          hideHighlights={false}
        />,
      );

      // After the flip the same filter sits in the second column, and the first column (Run B) is empty.
      expect(getSearchInputs()[2]).toHaveValue('Berlin');
      expect(getSearchInputs()[1]).toHaveValue('');
      expect(document.querySelector('[data-field-key="answer"]')).toBeTruthy();

      fireEvent.change(getSearchInputs()[1], { target: { value: 'Berlin' } });
      expect(document.querySelector('[data-field-key="answer"]')).toBeNull();
    });
  });
});

import { render, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import CompareRowDetailTable from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareRowDetailTable';
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

describe('CompareRowDetailTable', () => {
  test('renders field anchors and scrolls to focusFieldKey', async () => {
    render(
      <CompareRowDetailTable
        sections={sections}
        primaryRunName="Run A"
        comparedRunName="Run B"
        hasComparedMatch
        showDiffsOnly={false}
        hideHighlights={false}
        focusFieldKey="answer"
      />,
    );

    expect(document.querySelector('[data-field-key="answer"]')).toBeTruthy();
    await waitFor(() => {
      expect(scrollPivotToField).toHaveBeenCalledWith(expect.any(HTMLElement), 'answer');
    });
  });

  test('re-scrolls when focusRequestId changes for the same field', async () => {
    vi.mocked(scrollPivotToField).mockClear();

    const { rerender } = render(
      <CompareRowDetailTable
        sections={sections}
        primaryRunName="Run A"
        comparedRunName="Run B"
        hasComparedMatch
        showDiffsOnly={false}
        hideHighlights={false}
        focusFieldKey="answer"
        focusRequestId={1}
      />,
    );

    await waitFor(() => {
      expect(scrollPivotToField).toHaveBeenCalledTimes(1);
    });

    rerender(
      <CompareRowDetailTable
        sections={sections}
        primaryRunName="Run A"
        comparedRunName="Run B"
        hasComparedMatch
        showDiffsOnly={false}
        hideHighlights={false}
        focusFieldKey="answer"
        focusRequestId={2}
      />,
    );

    await waitFor(() => {
      expect(scrollPivotToField).toHaveBeenCalledTimes(2);
    });
  });
});

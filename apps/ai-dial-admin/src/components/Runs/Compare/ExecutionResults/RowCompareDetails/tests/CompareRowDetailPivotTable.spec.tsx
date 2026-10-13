import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { getCompareRuns } from '@/src/components/Runs/Compare/utils';

import CompareRowDetailPivotTable from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareRowDetailPivotTable';
import { RowDetailSection } from '@/src/components/Runs/Details/RowDetails/models';
import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';

vi.mock('@/src/components/Runs/Details/BottomDrawer/FullscreenDiffViewer', () => ({
  default: ({
    fieldLabel,
    original,
    modified,
    originalLabel,
    modifiedLabel,
  }: {
    fieldLabel: string;
    original: string;
    modified: string;
    originalLabel: string;
    modifiedLabel: string;
  }) => (
    <div role="dialog" aria-label={fieldLabel}>
      <span>{originalLabel}</span>
      <span>{original}</span>
      <span>{modifiedLabel}</span>
      <span>{modified}</span>
    </div>
  ),
}));

const sections: RowDetailSection[] = [
  {
    key: 'execution',
    label: 'Execution',
    rows: [
      {
        fieldKey: 'httpStatusCode',
        label: 'HTTP',
        primaryRaw: '200',
        secondaryRaw: '500',
        diffKind: MetricDeltaKind.Changed,
        isNumeric: true,
        isScoreIndicator: false,
        isMetric: false,
      },
    ],
  },
  {
    key: 'extractedColumns',
    label: 'Extracted',
    rows: [
      {
        fieldKey: 'answer',
        label: 'answer',
        primaryRaw: 'Primary long answer',
        secondaryRaw: 'Secondary long answer',
        diffKind: MetricDeltaKind.Changed,
        isNumeric: false,
        isScoreIndicator: false,
        isMetric: false,
      },
    ],
  },
];

const runs = getCompareRuns({ id: 'run-1', name: 'Run A' }, { id: 'run-2', name: 'Run B' });

describe('CompareRowDetailPivotTable', () => {
  test('renders primary and secondary value cells with data-field-key', () => {
    render(
      <CompareRowDetailPivotTable
        sections={sections}
        runs={runs}
        hasComparedMatch
        showDiffsOnly={false}
        hideHighlights={false}
      />,
    );

    expect(screen.getByText('Run A')).toBeInTheDocument();
    expect(screen.getByText('Run B')).toBeInTheDocument();
    expect(document.querySelectorAll('[data-field-key="httpStatusCode"]')).toHaveLength(2);
    expect(document.querySelectorAll('[data-field-key="answer"]')).toHaveLength(2);
  });

  test('opens dual-run popup with both primary and secondary values', async () => {
    render(
      <CompareRowDetailPivotTable
        sections={sections}
        runs={runs}
        hasComparedMatch
        showDiffsOnly={false}
        hideHighlights={false}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /Primary long answer/ }));

    const dialog = screen.getByRole('dialog', { name: 'answer' });
    expect(dialog).toHaveTextContent('Run A');
    expect(dialog).toHaveTextContent('Primary long answer');
    expect(dialog).toHaveTextContent('Run B');
    expect(dialog).toHaveTextContent('Secondary long answer');
  });

  test('right-aligns the header label of a right-aligned field', () => {
    render(
      <CompareRowDetailPivotTable
        sections={sections}
        runs={runs}
        hasComparedMatch
        showDiffsOnly={false}
        hideHighlights={false}
      />,
    );

    expect(screen.getByText('HTTP')).toHaveClass('text-right');
    expect(screen.getByText('answer')).not.toHaveClass('text-right');
  });

  test('right-aligns the delta cell for a numeric metric field', () => {
    const metricSections: RowDetailSection[] = [
      {
        key: 'Accuracy',
        label: 'Accuracy',
        rows: [
          {
            fieldKey: 'Accuracy_precision',
            label: 'precision',
            primaryRaw: '0.8',
            secondaryRaw: '0.6',
            diffKind: MetricDeltaKind.Changed,
            isNumeric: true,
            isScoreIndicator: false,
            isMetric: true,
          },
        ],
      },
    ];

    const { container } = render(
      <CompareRowDetailPivotTable
        sections={metricSections}
        runs={runs}
        hasComparedMatch
        showDiffsOnly={false}
        hideHighlights={false}
      />,
    );

    // The metric's own value cells stay left-aligned (not a fieldKey/score-indicator match); only the
    // delta cell gets justify-end.
    expect(container.querySelectorAll('.justify-end')).toHaveLength(1);
  });

  describe('run order', () => {
    const flippedRuns = [...runs].reverse();
    const renderPivot = (displayedRuns = runs) =>
      render(
        <CompareRowDetailPivotTable
          sections={sections}
          runs={displayedRuns}
          hasComparedMatch
          showDiffsOnly={false}
          hideHighlights={false}
        />,
      );
    const isBefore = (first: HTMLElement, second: HTMLElement) =>
      Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);

    test('lists the runs in the order given', () => {
      renderPivot(flippedRuns);

      expect(isBefore(screen.getByText('Run B'), screen.getByText('Run A'))).toBe(true);
    });

    test('keeps each value under its own run', () => {
      renderPivot(flippedRuns);

      expect(isBefore(screen.getByText('500'), screen.getByText('200'))).toBe(true);
    });

    test('opens the box on the bottom edge of the first row and the top edge of the last, whichever run that is', () => {
      const getHttpDiffCells = () =>
        Array.from(document.querySelectorAll('[data-compare-diff]')).filter((cell) =>
          /^(200|500)$/.test(cell.textContent ?? ''),
        );

      const { unmount } = renderPivot();
      let [first, last] = getHttpDiffCells();
      expect(first).toHaveTextContent('200');
      expect(first).toHaveClass('border-b-0');
      expect(last).toHaveClass('border-t-0');
      unmount();

      renderPivot(flippedRuns);
      [first, last] = getHttpDiffCells();
      expect(first).toHaveTextContent('500');
      expect(first).toHaveClass('border-b-0');
      expect(last).toHaveTextContent('200');
      expect(last).toHaveClass('border-t-0');
    });

    test('diff popup follows the displayed order', async () => {
      renderPivot(flippedRuns);

      await userEvent.click(screen.getByRole('button', { name: /Secondary long answer/ }));

      expect(screen.getByRole('dialog', { name: 'answer' })).toHaveTextContent(
        'Run BSecondary long answerRun APrimary long answer',
      );
    });
  });
});

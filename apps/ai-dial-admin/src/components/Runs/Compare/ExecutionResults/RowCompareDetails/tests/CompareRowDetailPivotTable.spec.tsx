import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

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

describe('CompareRowDetailPivotTable', () => {
  test('renders primary and secondary value cells with data-field-key', () => {
    render(
      <CompareRowDetailPivotTable
        sections={sections}
        primaryRunName="Run A"
        comparedRunName="Run B"
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
        primaryRunName="Run A"
        comparedRunName="Run B"
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
});

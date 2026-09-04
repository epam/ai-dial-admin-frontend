import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { RowDetailSection } from '@/src/components/Runs/Details/RowDetails/models';
import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import ExecutionRowDetailPivotTable from '../ExecutionRowDetailPivotTable';

vi.mock('@/src/components/Runs/View/RowDetails/FullscreenValueViewer', () => ({
  default: ({ fieldLabel, value }: { fieldLabel: string; value: string }) => (
    <div role="dialog" aria-label={fieldLabel}>
      {value}
    </div>
  ),
}));

const sections: RowDetailSection[] = [
  {
    key: 'execution',
    label: 'Execution',
    rows: [
      {
        fieldKey: 'executionStatus',
        label: 'Execution Status',
        primaryRaw: 'SUCCESS',
        secondaryRaw: null,
        diffKind: MetricDeltaKind.Empty,
        isNumeric: false,
        isScoreIndicator: false,
        isMetric: false,
      },
      {
        fieldKey: 'httpStatusCode',
        label: 'HTTP',
        primaryRaw: '200',
        secondaryRaw: null,
        diffKind: MetricDeltaKind.Empty,
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
        primaryRaw: 'A long answer that should truncate in the cell',
        secondaryRaw: null,
        diffKind: MetricDeltaKind.Empty,
        isNumeric: false,
        isScoreIndicator: false,
        isMetric: false,
      },
    ],
  },
];

describe('ExecutionRowDetailPivotTable', () => {
  test('renders a single value row of field cells', () => {
    render(<ExecutionRowDetailPivotTable sections={sections} />);

    expect(screen.getByText('HTTP')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('answer')).toBeInTheDocument();
    expect(document.querySelectorAll('[data-field-key]')).toHaveLength(3);
  });

  test('opens value popup when a cell is clicked', async () => {
    render(<ExecutionRowDetailPivotTable sections={sections} />);

    await userEvent.click(screen.getByRole('button', { name: /200/ }));

    expect(screen.getByRole('dialog', { name: 'HTTP' })).toHaveTextContent('200');
  });
});

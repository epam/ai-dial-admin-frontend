import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { SidebarPosition } from '@/src/components/Common/Sidebar/models';
import CompareRowDetailPanel from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareRowDetailPanel';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  getTestCaseRunResultDetails: vi.fn((id: string) =>
    Promise.resolve({
      id,
      executionStatus: 'SUCCESS',
      execDurationMs: 100,
      testCaseName: 'Case 1',
    }),
  ),
}));

vi.mock('@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareRowDetailPivotTable', () => ({
  default: () => <div>pivot</div>,
}));

vi.mock('@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareRowDetailTable', () => ({
  default: () => <div>table</div>,
}));

vi.mock('@/src/components/Runs/Compare/ExecutionResults/DiffLegend', () => ({
  default: () => null,
}));

vi.mock('@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareRowDetailDisplayPanel', () => ({
  default: ({ hideHighlights, viewDifferencesOnly }: { hideHighlights: boolean; viewDifferencesOnly: boolean }) => (
    <div>
      <span>{hideHighlights ? 'highlights-hidden' : 'highlights-shown'}</span>
      <span>{viewDifferencesOnly ? 'diffs-only' : 'all-rows'}</span>
    </div>
  ),
}));

const row = {
  id: 'r1',
  testCaseName: 'Case 1',
  _compared: { id: 'r2', testCaseName: 'Case 1' },
} as CompareAnalyticsRow;

describe('CompareRowDetailPanel', () => {
  test('persists Display tree after sections load', async () => {
    const onDisplayTreeChange = vi.fn();

    render(
      <CompareRowDetailPanel
        row={row}
        primaryRunName="Run A"
        comparedRunName="Run B"
        onClose={vi.fn()}
        position={SidebarPosition.Bottom}
        onSwitchDisplayMode={vi.fn()}
        onDisplayTreeChange={onDisplayTreeChange}
      />,
    );

    await waitFor(() => {
      expect(onDisplayTreeChange).toHaveBeenCalled();
    });
    expect(onDisplayTreeChange.mock.calls.at(-1)?.[0]).toEqual(expect.arrayContaining([expect.any(Object)]));
  });

  test('restores Display diff toggles from initial values', () => {
    render(
      <CompareRowDetailPanel
        row={row}
        primaryRunName="Run A"
        comparedRunName="Run B"
        onClose={vi.fn()}
        position={SidebarPosition.Bottom}
        onSwitchDisplayMode={vi.fn()}
        initialViewDifferencesOnly
        initialHideHighlights
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Runs.RunCompareDisplay' }));

    expect(screen.getByText('highlights-hidden')).toBeInTheDocument();
    expect(screen.getByText('diffs-only')).toBeInTheDocument();
  });
});

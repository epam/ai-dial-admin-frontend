import { fireEvent, render, screen } from '@testing-library/react';
import type { ColDef } from 'ag-grid-community';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { getCompareRuns } from '@/src/components/Runs/Compare/utils';

import { SidebarPosition } from '@/src/components/Common/Sidebar/models';
import CompareRowDetailPanel from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareRowDetailPanel';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';

const R1_METRICS = { Exact: { score: 1, recall: 1 }, Fuzzy: { score: 0.5 } };
const R2_METRICS = { Exact: { score: 0, recall: 0 }, Fuzzy: { score: 0.9 } };
const METRIC_GROUP_ORDER = ['Exact', 'Fuzzy'];
const detailState = { hasMetrics: false };

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  getTestCaseRunResultDetails: vi.fn((id: string) =>
    Promise.resolve({
      id,
      executionStatus: 'SUCCESS',
      execDurationMs: 100,
      testCaseName: 'Case 1',
      metricValues: detailState.hasMetrics ? (id === 'r1' ? R1_METRICS : R2_METRICS) : undefined,
    }),
  ),
}));

vi.mock('@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareRowDetailPivotTable', () => ({
  default: () => <div>pivot</div>,
}));

vi.mock('@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareRowDetailTable', () => ({
  default: ({ focusFieldKey }: { focusFieldKey?: string | null }) => (
    <div>table{focusFieldKey ? `:${focusFieldKey}` : ''}</div>
  ),
}));

vi.mock('@/src/components/Runs/Compare/ExecutionResults/DiffLegend', () => ({
  default: ({ counts }: { counts: { changed: number } }) => <div>{`diff:${counts.changed}`}</div>,
}));

vi.mock('@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareRowDetailDisplayPanel', () => ({
  default: ({
    columns,
    onColumnsChange,
    hideHighlights,
    viewDifferencesOnly,
  }: {
    columns: ColDef[];
    onColumnsChange: (columns: ColDef[]) => void;
    hideHighlights: boolean;
    viewDifferencesOnly: boolean;
  }) => (
    <div>
      <span>{hideHighlights ? 'highlights-hidden' : 'highlights-shown'}</span>
      <span>{viewDifferencesOnly ? 'diffs-only' : 'all-rows'}</span>
      {columns.map((group) => (
        <button
          key={group.headerName}
          type="button"
          onClick={() =>
            onColumnsChange(
              columns.map((node) =>
                node === group
                  ? {
                      ...node,
                      children: (node as { children: ColDef[] }).children.map((leaf) => ({
                        ...leaf,
                        hide: !leaf.hide,
                      })),
                    }
                  : node,
              ),
            )
          }
        >
          {`toggle ${group.headerName}`}
        </button>
      ))}
    </div>
  ),
}));

const row = {
  id: 'r1',
  testCaseName: 'Case 1',
  _compared: { id: 'r2', testCaseName: 'Case 1' },
} as CompareAnalyticsRow;

const runs = getCompareRuns({ id: 'run-1', name: 'Run A' }, { id: 'run-2', name: 'Run B' });

describe('CompareRowDetailPanel', () => {
  test('persists Display tree after sections load', async () => {
    const onDisplayTreeChange = vi.fn();

    render(
      <CompareRowDetailPanel
        row={row}
        runs={runs}
        onClose={vi.fn()}
        position={SidebarPosition.Bottom}
        onSwitchDisplayMode={vi.fn()}
        onDisplayTreeChange={onDisplayTreeChange}
      />,
    );

    await vi.waitFor(() => expect(onDisplayTreeChange).toHaveBeenCalled());
    expect(onDisplayTreeChange.mock.calls.at(-1)?.[0]).toEqual(expect.arrayContaining([expect.any(Object)]));
  });

  test('restores Display diff toggles from initial values', () => {
    render(
      <CompareRowDetailPanel
        row={row}
        runs={runs}
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

  test('passes focusFieldKey to the sidebar table', async () => {
    render(
      <CompareRowDetailPanel
        row={row}
        runs={runs}
        onClose={vi.fn()}
        position={SidebarPosition.Right}
        onSwitchDisplayMode={vi.fn()}
        focusFieldKey="answer"
      />,
    );

    expect(await screen.findByText('table:answer')).toBeInTheDocument();
  });

  describe('Diff counter', () => {
    beforeEach(() => {
      detailState.hasMetrics = true;
    });

    afterEach(() => {
      detailState.hasMetrics = false;
    });

    const renderPanel = (position = SidebarPosition.Bottom) =>
      render(
        <CompareRowDetailPanel
          row={row}
          runs={runs}
          onClose={vi.fn()}
          position={position}
          onSwitchDisplayMode={vi.fn()}
          metricGroupOrder={METRIC_GROUP_ORDER}
        />,
      );

    test('counts every differing field while all groups are shown', async () => {
      renderPanel();

      expect(await screen.findByText('diff:3')).toBeInTheDocument();
    });

    test('counts only the groups left enabled in Display > Rows and recounts when one is re-enabled', async () => {
      renderPanel();
      await screen.findByText('diff:3');

      fireEvent.click(screen.getByRole('button', { name: 'Runs.RunCompareDisplay' }));
      fireEvent.click(screen.getByRole('button', { name: 'toggle Fuzzy' }));

      expect(await screen.findByText('diff:2')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'toggle Fuzzy' }));

      expect(await screen.findByText('diff:3')).toBeInTheDocument();
    });

    test('shows the same count in the side panel', async () => {
      renderPanel(SidebarPosition.Right);
      await screen.findByText('diff:3');

      fireEvent.click(screen.getByRole('button', { name: 'Runs.RunCompareDisplay' }));
      fireEvent.click(screen.getByRole('button', { name: 'toggle Fuzzy' }));

      expect(await screen.findByText('diff:2')).toBeInTheDocument();
    });
  });
});

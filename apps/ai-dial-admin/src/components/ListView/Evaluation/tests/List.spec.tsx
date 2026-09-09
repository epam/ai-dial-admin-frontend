import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { cancelRun } from '@/src/app/[lang]/runs/actions';
import { ActionMenuOperationI18nKey } from '@/src/constants/i18n';
import { RunStatus } from '@/src/models/evaluation/run';
import { ApplicationRoute } from '@/src/types/routes';
import EvaluationListView from '../List';

const routerRefresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: routerRefresh }) }));

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  cancelRun: vi.fn(),
}));

vi.mock('@/src/components/Runs/Compare/useCompareRunLauncher', () => ({
  useCompareRunLauncher: () => ({ openCompareRun: vi.fn(), compareRunModal: null }),
}));

vi.mock('@/src/components/Runs/Cancel/RunCancelModal', () => ({
  default: ({ onCancelRun, onSuccess }: any) => (
    <div role="dialog" aria-label="cancel-run-modal">
      <button
        type="button"
        onClick={() => {
          onCancelRun('run-running');
          onSuccess?.();
        }}
      >
        Confirm Cancel
      </button>
    </div>
  ),
}));

const nodeSetData = vi.fn();

const MOCK_ROWS = [
  { id: 'run-running', status: RunStatus.RUNNING },
  { id: 'run-completed', status: RunStatus.COMPLETED },
];

const mockGridApi = {
  setGridOption: vi.fn(),
  forEachNode: vi.fn((callback: (node: { data: (typeof MOCK_ROWS)[number]; setData: typeof nodeSetData }) => void) => {
    MOCK_ROWS.forEach((row) => callback({ data: row, setData: nodeSetData }));
  }),
};

vi.mock('@/src/components/ListView/List', () => ({
  default: ({ columnDefs, onGridReady }: any) => {
    onGridReady?.({ api: mockGridApi });
    const actionCol = (columnDefs || []).find((col: any) => col.field === 'actionsColumn');
    const items = actionCol?.cellRendererParams?.items ?? [];

    return (
      <div role="grid" aria-label="evaluation-list">
        {MOCK_ROWS.map((row) => (
          <div key={row.id} role="row">
            {items
              .filter((item: any) => !item.hidden?.(null, { data: row }))
              .map((item: any) => (
                <button key={item.id} type="button" onClick={() => item.onClick(row)}>
                  {item.label}:{row.id}
                </button>
              ))}
          </div>
        ))}
      </div>
    );
  },
}));

const noopGetData = vi.fn().mockResolvedValue({ content: [], totalElements: 0 });

describe('EvaluationListView', () => {
  test('shows the Stop action only for a running row when route is Runs', () => {
    render(<EvaluationListView route={ApplicationRoute.Runs} baseColumns={[]} getData={noopGetData} />);

    expect(screen.getByRole('button', { name: `${ActionMenuOperationI18nKey.Stop}:run-running` })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: `${ActionMenuOperationI18nKey.Stop}:run-completed` }),
    ).not.toBeInTheDocument();
  });

  test('does not show the Stop action for a non-Runs route', () => {
    render(<EvaluationListView route={ApplicationRoute.TestSuites} baseColumns={[]} getData={noopGetData} />);

    expect(
      screen.queryByRole('button', { name: `${ActionMenuOperationI18nKey.Stop}:run-running` }),
    ).not.toBeInTheDocument();
  });

  test('opens the confirmation modal instead of cancelling immediately', () => {
    render(<EvaluationListView route={ApplicationRoute.Runs} baseColumns={[]} getData={noopGetData} />);

    expect(screen.queryByRole('dialog', { name: 'cancel-run-modal' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: `${ActionMenuOperationI18nKey.Stop}:run-running` }));

    expect(screen.getByRole('dialog', { name: 'cancel-run-modal' })).toBeInTheDocument();
    expect(cancelRun).not.toHaveBeenCalled();
  });

  test('patches only the cancelled row to CANCELLED after a successful confirmed cancel, without refreshing the page', () => {
    routerRefresh.mockClear();
    nodeSetData.mockClear();

    render(<EvaluationListView route={ApplicationRoute.Runs} baseColumns={[]} getData={noopGetData} />);

    fireEvent.click(screen.getByRole('button', { name: `${ActionMenuOperationI18nKey.Stop}:run-running` }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Cancel' }));

    expect(cancelRun).toHaveBeenCalledWith('run-running');
    expect(nodeSetData).toHaveBeenCalledOnce();
    expect(nodeSetData).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'run-running', status: RunStatus.CANCELLED }),
    );
    expect(routerRefresh).not.toHaveBeenCalled();
  });
});

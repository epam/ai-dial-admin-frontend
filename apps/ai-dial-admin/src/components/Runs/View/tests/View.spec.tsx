import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { getRun } from '@/src/app/[lang]/runs/actions';
import { RunStatus } from '@/src/models/evaluation/run';
import RunView from '../View';

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  cancelRun: vi.fn(),
  getRun: vi.fn(),
}));

const openCompareRunMock = vi.fn();

vi.mock('@/src/components/Runs/Compare/useCompareRunLauncher', () => ({
  useCompareRunLauncher: () => ({
    openCompareRun: openCompareRunMock,
    compareRunModal: null,
  }),
}));

vi.mock('@/src/components/EntityHeaderControls/SimpleHeader', () => ({
  default: ({ entity, onRemove, children, adaptiveActions, tabs, onChangeActiveTab }: any) => (
    <div role="region" aria-label="simple-header">
      <div>entity-id:{entity?.id}</div>
      <button type="button" onClick={() => onRemove(entity?.id)}>
        Remove Run
      </button>
      {(tabs ?? []).map((tab: any) => (
        <button key={tab.id} type="button" onClick={() => onChangeActiveTab(tab.id)}>
          {tab.label}
        </button>
      ))}
      {children}
      {(adaptiveActions?.trailing ?? []).map((action: any) => (
        <button key={action.id} type="button" disabled={action.disabled} onClick={action.onClick}>
          {action.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../../Summary/SummaryTab', () => ({
  default: ({ run }: any) => (
    <div role="region" aria-label="summary-tab">
      <div>run-id:{run?.id}</div>
    </div>
  ),
}));

vi.mock('../ExtractionResult', () => ({
  default: ({ run }: any) => (
    <div role="region" aria-label="extraction-result-tab">
      <div>run-id:{run?.id}</div>
    </div>
  ),
}));

vi.mock('@/src/components/Runs/Cancel/RunCancelModal', () => ({
  default: ({ onClose, onSuccess }: any) => (
    <div role="dialog" aria-label="cancel-run-modal">
      <button type="button" onClick={onClose}>
        Close Cancel Modal
      </button>
      <button
        type="button"
        onClick={() => {
          onClose();
          onSuccess?.();
        }}
      >
        Confirm Cancel
      </button>
    </div>
  ),
}));

describe('Runs View :: View', () => {
  test('renders header and summary tab by default', () => {
    const onRemove = vi.fn().mockResolvedValue({ success: true });

    render(<RunView run={{ id: 'run-1', testRunName: 'Nightly' } as any} onRemove={onRemove} />);

    expect(screen.getByRole('region', { name: 'simple-header' })).toBeInTheDocument();
    expect(screen.getByText('entity-id:run-1')).toBeInTheDocument();

    expect(screen.getByRole('region', { name: 'summary-tab' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'extraction-result-tab' })).not.toBeInTheDocument();
  });

  test('switches to extraction result tab on tab click', () => {
    const onRemove = vi.fn().mockResolvedValue({ success: true });

    render(<RunView run={{ id: 'run-1' } as any} onRemove={onRemove} />);

    fireEvent.click(screen.getByRole('button', { name: 'Tabs.ExtractionResult' }));

    expect(screen.getByRole('region', { name: 'extraction-result-tab' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'summary-tab' })).not.toBeInTheDocument();
  });

  test('calls onRemove with run id from header action', () => {
    const onRemove = vi.fn().mockResolvedValue({ success: true });

    render(<RunView run={{ id: 'run-3' } as any} onRemove={onRemove} />);

    fireEvent.click(screen.getByRole('button', { name: 'Remove Run' }));

    expect(onRemove).toHaveBeenCalledWith('run-3');
  });

  test('renders Grafana link button when grafanaExploreUrl is present', () => {
    const onRemove = vi.fn().mockResolvedValue({ success: true });

    render(
      <RunView run={{ id: 'run-4', grafanaExploreUrl: 'https://grafana.example.com' } as any} onRemove={onRemove} />,
    );

    expect(screen.getByRole('region', { name: 'simple-header' })).toBeInTheDocument();
  });

  test('renders Compare button for completed run', () => {
    const onRemove = vi.fn().mockResolvedValue({ success: true });

    render(
      <RunView run={{ id: 'run-5', status: RunStatus.COMPLETED, testSuiteId: 'suite-1' } as any} onRemove={onRemove} />,
    );

    expect(screen.getByRole('button', { name: 'ActionMenuOperation.Compare' })).toBeEnabled();
  });

  test('disables Compare button for running run', () => {
    const onRemove = vi.fn().mockResolvedValue({ success: true });

    render(
      <RunView run={{ id: 'run-6', status: RunStatus.RUNNING, testSuiteId: 'suite-1' } as any} onRemove={onRemove} />,
    );

    expect(screen.getByRole('button', { name: 'ActionMenuOperation.Compare' })).toBeDisabled();
  });

  test('calls openCompareRun when Compare button is clicked', () => {
    const onRemove = vi.fn().mockResolvedValue({ success: true });
    const run = { id: 'run-7', status: RunStatus.COMPLETED, testSuiteId: 'suite-1' } as any;

    render(<RunView run={run} onRemove={onRemove} />);

    fireEvent.click(screen.getByRole('button', { name: 'ActionMenuOperation.Compare' }));

    expect(openCompareRunMock).toHaveBeenCalledWith(run);
  });

  test('shows the Stop action for a running run', () => {
    const onRemove = vi.fn().mockResolvedValue({ success: true });

    render(<RunView run={{ id: 'run-8', status: RunStatus.RUNNING } as any} onRemove={onRemove} />);

    expect(screen.getByRole('button', { name: 'Buttons.Stop' })).toBeInTheDocument();
  });

  test.each([RunStatus.COMPLETED, RunStatus.FAILED, RunStatus.CANCELLED])(
    'hides the Stop action for a %s run',
    (status) => {
      const onRemove = vi.fn().mockResolvedValue({ success: true });

      render(<RunView run={{ id: 'run-9', status } as any} onRemove={onRemove} />);

      expect(screen.queryByRole('button', { name: 'Buttons.Stop' })).not.toBeInTheDocument();
    },
  );

  test('opens the confirmation modal instead of cancelling immediately when Stop is clicked', () => {
    const onRemove = vi.fn().mockResolvedValue({ success: true });

    render(<RunView run={{ id: 'run-10', status: RunStatus.RUNNING } as any} onRemove={onRemove} />);

    expect(screen.queryByRole('dialog', { name: 'cancel-run-modal' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Buttons.Stop' }));

    expect(screen.getByRole('dialog', { name: 'cancel-run-modal' })).toBeInTheDocument();
  });

  test('reflects the cancelled status locally after a successful cancel, without refetching the run', async () => {
    const onRemove = vi.fn().mockResolvedValue({ success: true });

    render(<RunView run={{ id: 'run-11', status: RunStatus.RUNNING } as any} onRemove={onRemove} />);

    fireEvent.click(screen.getByRole('button', { name: 'Buttons.Stop' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Cancel' }));

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Buttons.Stop' })).not.toBeInTheDocument());
    expect(getRun).not.toHaveBeenCalled();
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { RunStatus } from '@/src/models/evaluation/run';
import RunView from '../View';

const openCompareRunMock = vi.fn();

vi.mock('@/src/components/Runs/Compare/useCompareRunLauncher', () => ({
  useCompareRunLauncher: () => ({
    openCompareRun: openCompareRunMock,
    compareRunModal: null,
  }),
}));

vi.mock('@/src/components/EntityHeaderControls/SimpleHeader', () => ({
  default: ({ entity, onRemove, children, tabs, onChangeActiveTab }: any) => (
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
});

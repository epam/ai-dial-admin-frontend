import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import RunView from '../View';

vi.mock('@/src/components/EntityHeaderControls/SimpleHeader', () => ({
  default: ({ entity, onRemove, children }: any) => (
    <div role="region" aria-label="simple-header">
      <div>entity-id:{entity?.id}</div>
      <button type="button" onClick={() => onRemove(entity?.id)}>
        Remove Run
      </button>
      {children}
    </div>
  ),
}));

vi.mock('@/src/components/EntityHeaderControls/Info/InfoHeader', () => ({
  default: ({ postfix }: any) => (
    <div role="region" aria-label="info-header">
      {postfix}
    </div>
  ),
}));

vi.mock('../Analytics', () => ({
  default: ({ run }: any) => (
    <div role="region" aria-label="analytics-tab">
      <div>run-id:{run?.id}</div>
    </div>
  ),
}));

describe('Runs View :: View', () => {
  test('renders header and analytics tab with run data', () => {
    const onRemove = vi.fn().mockResolvedValue({ success: true });

    render(<RunView run={{ id: 'run-1', testRunName: 'Nightly' } as any} onRemove={onRemove} />);

    expect(screen.getByRole('region', { name: 'simple-header' })).toBeInTheDocument();
    expect(screen.getByText('entity-id:run-1')).toBeInTheDocument();

    expect(screen.getByRole('region', { name: 'analytics-tab' })).toBeInTheDocument();
    expect(screen.getByText('run-id:run-1')).toBeInTheDocument();
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
});

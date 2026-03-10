import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { EntityViewTab } from '@/src/utils/tabs/utils';
import RunView from '../View';

vi.mock('@/src/components/EntityHeaderControls/SimpleHeader', () => ({
  default: ({ view, entity, activeTab, onChangeActiveTab, onRemove }: any) => (
    <div role="region" aria-label="simple-header">
      <div>view:{view}</div>
      <div>entity-id:{entity?.id}</div>
      <div>active-tab:{activeTab}</div>
      <button type="button" onClick={() => onChangeActiveTab(EntityViewTab.ExtractionResult)}>
        Switch Tab
      </button>
      <button type="button" onClick={() => onRemove(entity?.id)}>
        Remove Run
      </button>
    </div>
  ),
}));

vi.mock('../TabsContent', () => ({
  default: ({ run, activeTab }: any) => (
    <div role="region" aria-label="tabs-content">
      <div>run-id:{run?.id}</div>
      <div>tab:{activeTab}</div>
    </div>
  ),
}));

describe('Runs View :: View', () => {
  test('renders with summary tab by default and passes run to children', () => {
    const onRemove = vi.fn().mockResolvedValue({ success: true });

    render(<RunView run={{ id: 'run-1', testRunName: 'Nightly' }} onRemove={onRemove} />);

    expect(screen.getByRole('region', { name: 'simple-header' })).toBeInTheDocument();
    expect(screen.getByText('entity-id:run-1')).toBeInTheDocument();
    expect(screen.getByText(`active-tab:${EntityViewTab.Summary}`)).toBeInTheDocument();

    expect(screen.getByRole('region', { name: 'tabs-content' })).toBeInTheDocument();
    expect(screen.getByText('run-id:run-1')).toBeInTheDocument();
    expect(screen.getByText(`tab:${EntityViewTab.Summary}`)).toBeInTheDocument();
  });

  test('changes tab when header requests active tab update', () => {
    const onRemove = vi.fn().mockResolvedValue({ success: true });

    render(<RunView run={{ id: 'run-2' }} onRemove={onRemove} />);

    fireEvent.click(screen.getByRole('button', { name: 'Switch Tab' }));

    expect(screen.getByText(`active-tab:${EntityViewTab.ExtractionResult}`)).toBeInTheDocument();
    expect(screen.getByText(`tab:${EntityViewTab.ExtractionResult}`)).toBeInTheDocument();
  });

  test('calls onRemove with run id from header action', () => {
    const onRemove = vi.fn().mockResolvedValue({ success: true });

    render(<RunView run={{ id: 'run-3' }} onRemove={onRemove} />);

    fireEvent.click(screen.getByRole('button', { name: 'Remove Run' }));

    expect(onRemove).toHaveBeenCalledWith('run-3');
  });
});

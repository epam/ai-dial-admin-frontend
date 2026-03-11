import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { Container } from '@/src/models/deployments/containers';
import { CONTAINER_SOURCE_TYPE, CONTAINER_STATUS, CONTAINER_TYPE } from '@/src/types/deployments/containers';
import ContainerBase from '@/src/components/Deployments/Fields/ContainerBase';

vi.mock('@/src/components/BaseControls/Id/Id', () => ({
  default: ({ entity }: any) => <div aria-label="id-control">id:{entity?.name}</div>,
}));

vi.mock('@/src/components/BaseControls/DisplayName', () => ({
  default: ({ displayName }: any) => <div aria-label="display-name-control">displayName:{displayName}</div>,
}));

vi.mock('@/src/components/BaseControls/Description', () => ({
  default: ({ entity }: any) => <div aria-label="description-control">description:{entity?.description}</div>,
}));

vi.mock('@/src/components/BaseControls/Maintainer', () => ({
  default: ({ entity }: any) => <div aria-label="maintainer-control">author:{entity?.author}</div>,
}));

vi.mock('@/src/components/BaseControls/Topics', () => ({
  default: ({ entity, onChange }: any) => (
    <section aria-label="topics-control">
      <div>topics:{(entity?.topics || []).length}</div>
      <button type="button" onClick={() => onChange({ ...entity, topics: ['new-topic'] })}>
        Change topics
      </button>
    </section>
  ),
}));

describe('ContainerBase', () => {
  const baseContainer: Container = {
    $type: CONTAINER_TYPE.MCP,
    name: 'test-container',
    displayName: 'Test Container',
    description: 'A test container',
    author: 'test-author',
    status: CONTAINER_STATUS.NOT_DEPLOYED,
    source: { $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE, imageDefinitionId: '' },
    metadata: { envs: [] },
    topics: ['existing-topic'],
  };

  let setContainer: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    setContainer = vi.fn();
  });

  test('renders TopicsControl in non-modal mode', () => {
    render(<ContainerBase container={baseContainer} setContainer={setContainer} />);

    expect(screen.getByRole('region', { name: 'topics-control' })).toBeInTheDocument();
    expect(screen.getByText('topics:1')).toBeInTheDocument();
  });

  test('does not render TopicsControl in modal mode', () => {
    render(<ContainerBase container={baseContainer} setContainer={setContainer} isModal />);

    expect(screen.queryByRole('region', { name: 'topics-control' })).not.toBeInTheDocument();
  });

  test('calls setContainer when topics are changed', () => {
    render(<ContainerBase container={baseContainer} setContainer={setContainer} />);

    fireEvent.click(screen.getByText('Change topics'));

    expect(setContainer).toHaveBeenCalledWith(expect.objectContaining({ topics: ['new-topic'] }));
  });
});

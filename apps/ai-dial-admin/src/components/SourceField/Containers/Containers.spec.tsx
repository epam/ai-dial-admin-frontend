import { render, screen, waitFor } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';

import Containers from '@/src/components/SourceField/Containers/Containers';
import { DialModel, DialModelType } from '@/src/models/dial/model';
import { Container } from '@/src/models/deployments/containers';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { ApplicationRoute } from '@/src/types/routes';
import { CONTAINER_STATUS, CONTAINER_SOURCE_TYPE, CONTAINER_TYPE } from '@/src/types/deployments/containers';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: vi.fn(),
}));

vi.mock('@/src/hooks/use-protected-request', () => ({
  useProtectedRequest: () => vi.fn((fn) => fn()),
}));

const runningContainer: Container = {
  name: 'container-running',
  displayName: 'Running Container',
  $type: CONTAINER_TYPE.NIM,
  source: { $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE },
  status: CONTAINER_STATUS.RUNNING,
  url: 'http://running.local',
  metadata: { envs: [] },
};

const stoppedContainer: Container = {
  name: 'container-stopped',
  displayName: 'Stopped Container',
  $type: CONTAINER_TYPE.NIM,
  source: { $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE },
  status: CONTAINER_STATUS.STOPPED,
  url: '',
  metadata: { envs: [] },
};

const createEntity = (containerId: string): DialModel => ({
  name: 'test-model',
  displayName: 'Test Model',
  type: DialModelType.Chat,
  source: { $type: SOURCE_TYPE.CONTAINER, containerId },
});

const mockGetContainers = (containers: Container[]) =>
  vi.fn(() => Promise.resolve({ success: true, response: containers }));

describe('Containers component', () => {
  test('displays stopped container display name in edit view', async () => {
    const entity = createEntity('container-stopped');

    render(
      <Containers
        entity={entity}
        onChange={vi.fn()}
        getContainers={mockGetContainers([runningContainer, stoppedContainer])}
        view={ApplicationRoute.Models}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Stopped Container')).toBeInTheDocument();
    });
  });

  test('displays running container name in edit view', async () => {
    const entity = createEntity('container-running');

    render(
      <Containers
        entity={entity}
        onChange={vi.fn()}
        getContainers={mockGetContainers([runningContainer, stoppedContainer])}
        view={ApplicationRoute.Models}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Running Container')).toBeInTheDocument();
    });
  });

  test('shows empty state when container is not returned by API', async () => {
    const entity = createEntity('container-deleted');

    render(
      <Containers
        entity={entity}
        onChange={vi.fn()}
        getContainers={mockGetContainers([runningContainer])}
        view={ApplicationRoute.Models}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Entities.NoContainers')).toBeInTheDocument();
    });
  });
});

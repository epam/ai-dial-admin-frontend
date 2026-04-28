import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';

import Containers from '@/src/components/SourceField/Containers/Containers';
import { DialModel, DialModelType } from '@/src/models/dial/model';
import { DialApplication } from '@/src/models/dial/application';
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

vi.mock('@epam/ai-dial-ui-kit', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@epam/ai-dial-ui-kit');
  return {
    ...actual,
    DialSelectField: ({ options, onChange, id, value }: any) => (
      <select aria-label={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">--</option>
        {options?.map((o: any) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    ),
  };
});

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

const hfContainer: Container = {
  name: 'container-hf',
  displayName: 'HF Container',
  $type: CONTAINER_TYPE.HF,
  source: { $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE },
  status: CONTAINER_STATUS.RUNNING,
  url: 'http://hf.local',
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

  test('applies v1 prefix when a NIM container is selected', async () => {
    const onChange = vi.fn();
    const entity = createEntity('');

    render(
      <Containers
        entity={entity}
        onChange={onChange}
        getContainers={mockGetContainers([runningContainer, hfContainer])}
        view={ApplicationRoute.Models}
        isModal
      />,
    );

    const select = await screen.findByRole('combobox');
    fireEvent.change(select, { target: { value: 'container-running' } });

    const lastCall = onChange.mock.calls.at(-1)?.[0] as DialModel;
    expect(lastCall.source?.completionEndpointPath?.startsWith('v1/')).toBe(true);
    expect(lastCall.source?.completionEndpointPath?.startsWith('openai/')).toBe(false);
  });

  test('applies openai/v1 prefix when a non-NIM container is selected', async () => {
    const onChange = vi.fn();
    const entity = createEntity('');

    render(
      <Containers
        entity={entity}
        onChange={onChange}
        getContainers={mockGetContainers([runningContainer, hfContainer])}
        view={ApplicationRoute.Models}
        isModal
      />,
    );

    const select = await screen.findByRole('combobox');
    fireEvent.change(select, { target: { value: 'container-hf' } });

    const lastCall = onChange.mock.calls.at(-1)?.[0] as DialModel;
    expect(lastCall.source?.completionEndpointPath?.startsWith('openai/v1/')).toBe(true);
  });

  test('renders warning icon when saved container is not running', async () => {
    const entity = createEntity('container-stopped');

    const { container } = render(
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
    const visibleWarningIcon = container.querySelector('svg.tabler-icon-alert-triangle-filled.text-warning-icon');
    expect(visibleWarningIcon).not.toBeNull();
    expect(visibleWarningIcon?.getAttribute('class') ?? '').not.toContain('hidden');
  });

  test('does not render visible warning icon when saved container is running', async () => {
    const entity = createEntity('container-running');

    const { container } = render(
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
    const warningIcon = container.querySelector('svg.tabler-icon-alert-triangle-filled');
    // Icon node may exist but is hidden via the `hidden` class when warningText is undefined
    expect(warningIcon === null || (warningIcon.getAttribute('class') ?? '').includes('hidden')).toBe(true);
  });

  test('does not render visible warning icon when containerId does not match any fetched container', async () => {
    const entity = createEntity('container-deleted');

    const { container } = render(
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
    const warningIcon = container.querySelector('svg.tabler-icon-alert-triangle-filled');
    expect(warningIcon === null || (warningIcon.getAttribute('class') ?? '').includes('hidden')).toBe(true);
  });

  test('Application branch: writes containerId, skips completionEndpointPath', async () => {
    const onChange = vi.fn();
    // mcp must be present (even as undefined) so that isDialApplication() returns true
    const entity: DialApplication = {
      name: 'test-app',
      displayName: 'Test App',
      mcp: undefined,
      source: { $type: SOURCE_TYPE.CONTAINER, containerId: '' },
    } as unknown as DialApplication;

    render(
      <Containers
        entity={entity}
        onChange={onChange}
        getContainers={mockGetContainers([runningContainer])}
        view={ApplicationRoute.Applications}
        isModal
      />,
    );

    const select = await screen.findByRole('combobox');
    fireEvent.change(select, { target: { value: 'container-running' } });

    const lastCall = onChange.mock.calls.at(-1)?.[0] as DialApplication;
    expect(lastCall.source?.containerId).toBe('container-running');
    expect(lastCall.source?.completionEndpointPath).toBeUndefined();
  });
});

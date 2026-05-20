import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey, DeploymentsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { Container } from '@/src/models/deployments/containers';
import { NodePool } from '@/src/models/deployments/node-pools';
import { NotificationType } from '@/src/models/notification';
import { CONTAINER_SOURCE_TYPE, CONTAINER_STATUS, CONTAINER_TYPE } from '@/src/types/deployments/containers';

import ContainerNodePool from '@/src/components/Deployments/Fields/ContainerNodePool';

const getNodePoolsMock = vi.fn();
const showNotificationMock = vi.fn();

vi.mock('@/src/app/actions/deployments', () => ({
  getNodePools: () => getNodePoolsMock(),
}));

vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification: showNotificationMock, removeNotification: vi.fn() }),
}));

const gpuPool: NodePool = {
  id: 'gpu-pool',
  name: 'GPU pool',
  description: 'High-end inference pool',
};

const cpuPool: NodePool = {
  id: 'cpu-pool',
  name: 'CPU pool',
};

const baseContainer: Container = {
  $type: CONTAINER_TYPE.MCP,
  name: 'test-container',
  displayName: 'Test Container',
  status: CONTAINER_STATUS.NOT_DEPLOYED,
  source: { $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE, imageDefinitionId: '' },
  metadata: { envs: [] },
};

const renderContainer = (container: Container = baseContainer) => {
  const setContainer = vi.fn();
  render(<ContainerNodePool container={container} setContainer={setContainer} />);
  return { setContainer };
};

const waitForLoad = () =>
  waitFor(() => {
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

describe('ContainerNodePool', () => {
  beforeEach(() => {
    getNodePoolsMock.mockReset();
    showNotificationMock.mockReset();
  });

  test('renders the field title', async () => {
    getNodePoolsMock.mockResolvedValue({ success: true, response: { pools: [] } });
    renderContainer();
    expect(screen.getByText(EntityFieldsI18nKey.NodePool)).toBeInTheDocument();
  });

  test('shows "Any node pool" by default when nodePoolId is null/undefined', async () => {
    getNodePoolsMock.mockResolvedValue({ success: true, response: { pools: [gpuPool, cpuPool] } });
    renderContainer();
    await waitForLoad();
    expect(screen.getByText(DeploymentsI18nKey.NodePoolAny)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: DeploymentsI18nKey.NodePoolSelect })).toBeInTheDocument();
  });

  test('hydrates initial selection from container.nodePoolId / nodePoolName', async () => {
    getNodePoolsMock.mockResolvedValue({ success: true, response: { pools: [gpuPool, cpuPool] } });
    renderContainer({ ...baseContainer, nodePoolId: 'gpu-pool', nodePoolName: 'GPU pool' });
    await waitForLoad();
    expect(screen.getByText('GPU pool')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Change })).toBeInTheDocument();
  });

  test('shows warning state when nodePoolId is dangling (name is null)', async () => {
    getNodePoolsMock.mockResolvedValue({ success: true, response: { pools: [gpuPool] } });
    renderContainer({ ...baseContainer, nodePoolId: 'ghost', nodePoolName: null });
    await waitForLoad();
    expect(screen.getByText(DeploymentsI18nKey.NodePoolUnknown)).toBeInTheDocument();
  });

  test('writes nodePoolId + nodePoolName when a pool is applied', async () => {
    getNodePoolsMock.mockResolvedValue({ success: true, response: { pools: [gpuPool, cpuPool] } });
    const { setContainer } = renderContainer();
    await waitForLoad();

    fireEvent.click(screen.getByRole('button', { name: DeploymentsI18nKey.NodePoolSelect }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('radio', { name: /GPU pool/i }));
    fireEvent.click(within(dialog).getByRole('button', { name: ButtonsI18nKey.Apply }));

    await waitFor(() => {
      expect(setContainer).toHaveBeenCalledWith(
        expect.objectContaining({ nodePoolId: 'gpu-pool', nodePoolName: 'GPU pool' }),
      );
    });
  });

  test('selecting "Any" sets nodePoolId to null', async () => {
    getNodePoolsMock.mockResolvedValue({ success: true, response: { pools: [gpuPool] } });
    const { setContainer } = renderContainer({
      ...baseContainer,
      nodePoolId: 'gpu-pool',
      nodePoolName: 'GPU pool',
    });
    await waitForLoad();

    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.Change }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getAllByRole('radio')[0]);
    fireEvent.click(within(dialog).getByRole('button', { name: ButtonsI18nKey.Apply }));

    await waitFor(() => {
      expect(setContainer).toHaveBeenCalledWith(expect.objectContaining({ nodePoolId: null, nodePoolName: null }));
    });
  });

  test('Cancel does not touch the container', async () => {
    getNodePoolsMock.mockResolvedValue({ success: true, response: { pools: [gpuPool, cpuPool] } });
    const { setContainer } = renderContainer();
    await waitForLoad();

    fireEvent.click(screen.getByRole('button', { name: DeploymentsI18nKey.NodePoolSelect }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('radio', { name: /GPU pool/i }));
    fireEvent.click(within(dialog).getByRole('button', { name: ButtonsI18nKey.Cancel }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(setContainer).not.toHaveBeenCalled();
  });

  test('shows a toast notification on load failure', async () => {
    getNodePoolsMock.mockResolvedValue({
      success: false,
      errorHeader: 'Service unavailable',
      errorMessage: 'boom',
      requestId: 'req-42',
    });
    renderContainer();

    await waitFor(() => {
      expect(showNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.error,
          title: 'Service unavailable',
          description: 'boom',
          requestId: 'req-42',
        }),
      );
    });
    expect(screen.queryByText('boom')).not.toBeInTheDocument();
  });

  test('falls back to default load-error title when server omits errorHeader', async () => {
    getNodePoolsMock.mockResolvedValue({ success: false });
    renderContainer();

    await waitFor(() => {
      expect(showNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.error,
          title: DeploymentsI18nKey.NodePoolLoadError,
        }),
      );
    });
  });

  test('search filters the modal list by name', async () => {
    getNodePoolsMock.mockResolvedValue({ success: true, response: { pools: [gpuPool, cpuPool] } });
    renderContainer();
    await waitForLoad();

    fireEvent.click(screen.getByRole('button', { name: DeploymentsI18nKey.NodePoolSelect }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('radio', { name: /GPU pool/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('radio', { name: /CPU pool/i })).toBeInTheDocument();

    const searchInput = within(dialog).getByPlaceholderText(DeploymentsI18nKey.NodePoolSearchPlaceholder);
    fireEvent.change(searchInput, { target: { value: 'cpu' } });

    expect(within(dialog).queryByRole('radio', { name: /GPU pool/i })).not.toBeInTheDocument();
    expect(within(dialog).getByRole('radio', { name: /CPU pool/i })).toBeInTheDocument();
    expect(within(dialog).getByText(DeploymentsI18nKey.NodePoolAny)).toBeInTheDocument();
  });
});

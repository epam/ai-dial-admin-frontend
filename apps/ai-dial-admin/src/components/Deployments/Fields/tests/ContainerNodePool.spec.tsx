import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey, DeploymentsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { Container } from '@/src/models/deployments/containers';
import { NodePool } from '@/src/models/deployments/node-pools';
import { CONTAINER_SOURCE_TYPE, CONTAINER_STATUS, CONTAINER_TYPE } from '@/src/types/deployments/containers';

import ContainerNodePool from '@/src/components/Deployments/Fields/ContainerNodePool';

const getNodePoolsMock = vi.fn();

vi.mock('@/src/app/actions/deployments', () => ({
  getNodePools: () => getNodePoolsMock(),
}));

const GiB = 1024 ** 3;

const gpuPool: NodePool = {
  name: 'gpu-a100-prod',
  description: 'High-end inference pool',
  cpu: { milliCpus: 32000, name: 'Intel Xeon Platinum' },
  memory: { bytes: 256 * GiB },
  gpu: { name: 'NVIDIA A100', count: 4, vramBytes: 80 * GiB },
  minNodes: 0,
  maxNodes: 4,
  instance: 'p4d.24xlarge',
};

const cpuPool: NodePool = {
  name: 'cpu-standard',
  cpu: { milliCpus: 8000 },
  memory: { bytes: 32 * GiB },
  minNodes: 1,
  maxNodes: 10,
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
  });

  test('renders the accordion title', async () => {
    getNodePoolsMock.mockResolvedValue({ success: true, response: [] });
    renderContainer();
    expect(screen.getByText(EntityFieldsI18nKey.NodePool)).toBeInTheDocument();
  });

  test('shows empty state when endpoint returns no pools', async () => {
    getNodePoolsMock.mockResolvedValue({ success: true, response: [] });
    renderContainer();
    await waitFor(() => {
      expect(screen.getByText(DeploymentsI18nKey.NodePoolEmpty)).toBeInTheDocument();
    });
  });

  test('shows placeholder + Select button when no pool is selected', async () => {
    getNodePoolsMock.mockResolvedValue({ success: true, response: [gpuPool, cpuPool] });
    renderContainer();
    await waitForLoad();
    expect(screen.getByText(DeploymentsI18nKey.NodePoolNotSelected)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: DeploymentsI18nKey.NodePoolSelect })).toBeInTheDocument();
  });

  test('hydrates initial selection from container.nodePool', async () => {
    getNodePoolsMock.mockResolvedValue({ success: true, response: [gpuPool, cpuPool] });
    renderContainer({ ...baseContainer, nodePool: 'gpu-a100-prod' });
    await waitForLoad();
    expect(screen.getByText('gpu-a100-prod')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Change })).toBeInTheDocument();
  });

  test('writes nodePool back to the container when a pool is applied', async () => {
    getNodePoolsMock.mockResolvedValue({ success: true, response: [gpuPool, cpuPool] });
    const { setContainer } = renderContainer();
    await waitForLoad();

    fireEvent.click(screen.getByRole('button', { name: DeploymentsI18nKey.NodePoolSelect }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('radio', { name: /gpu-a100-prod/i }));
    fireEvent.click(within(dialog).getByRole('button', { name: ButtonsI18nKey.Apply }));

    await waitFor(() => {
      expect(setContainer).toHaveBeenCalledWith(expect.objectContaining({ nodePool: 'gpu-a100-prod' }));
    });
  });

  test('clears nodePool on Remove', async () => {
    getNodePoolsMock.mockResolvedValue({ success: true, response: [gpuPool] });
    const container: Container = { ...baseContainer, nodePool: 'gpu-a100-prod' };
    const setContainer = vi.fn();
    render(<ContainerNodePool container={container} setContainer={setContainer} />);
    await waitForLoad();

    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.Remove }));
    expect(setContainer).toHaveBeenCalledWith(expect.objectContaining({ nodePool: undefined }));
  });

  test('Cancel does not touch the container', async () => {
    getNodePoolsMock.mockResolvedValue({ success: true, response: [gpuPool, cpuPool] });
    const { setContainer } = renderContainer();
    await waitForLoad();

    fireEvent.click(screen.getByRole('button', { name: DeploymentsI18nKey.NodePoolSelect }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('radio', { name: /gpu-a100-prod/i }));
    fireEvent.click(within(dialog).getByRole('button', { name: ButtonsI18nKey.Cancel }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(setContainer).not.toHaveBeenCalled();
  });

  test('shows load error when endpoint fails', async () => {
    getNodePoolsMock.mockResolvedValue({ success: false, errorMessage: 'boom' });
    renderContainer();
    await waitFor(() => {
      expect(screen.getByText('boom')).toBeInTheDocument();
    });
  });
});

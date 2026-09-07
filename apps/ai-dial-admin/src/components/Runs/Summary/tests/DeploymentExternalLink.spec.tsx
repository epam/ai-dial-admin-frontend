import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { DeploymentType } from '@/src/models/evaluation/deployment';
import { SuiteType } from '@/src/models/evaluation/test-suite';
import DeploymentExternalLink from '../DeploymentExternalLink';

const getDeploymentByIdMock = vi.fn();
const getAllDeploymentsMock = vi.fn();
const onOpenInNewTabMock = vi.fn();

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getDeploymentById: (...args: unknown[]) => getDeploymentByIdMock(...args),
}));

vi.mock('@/src/app/[lang]/conversations/actions', () => ({
  getAllDeployments: (...args: unknown[]) => getAllDeploymentsMock(...args),
}));

vi.mock('@/src/utils/open-in-new-tab', () => ({
  onOpenInNewTab: (...args: unknown[]) => onOpenInNewTabMock(...args),
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialIconButton: ({ onClick }: { onClick?: () => void }) => (
      <button type="button" aria-label="Open deployment" onClick={onClick} />
    ),
    DialLoader: () => <div role="status" aria-label="loading" />,
  };
});

describe('DeploymentExternalLink', () => {
  beforeEach(() => {
    getDeploymentByIdMock.mockReset();
    getAllDeploymentsMock.mockReset();
    onOpenInNewTabMock.mockReset();
  });

  test('shows loader while resolving type', () => {
    getDeploymentByIdMock.mockReturnValue(new Promise(() => undefined));

    render(
      <DeploymentExternalLink
        suiteContext={{
          deploymentRef: { id: 'app-1', name: 'App' },
        }}
      />,
    );

    expect(screen.getByRole('status', { name: 'loading' })).toBeInTheDocument();
    expect(getAllDeploymentsMock).not.toHaveBeenCalled();
  });

  test('renders external link when type is resolved', async () => {
    getDeploymentByIdMock.mockResolvedValue({
      $type: DeploymentType.Application,
      deploymentId: 'app-1',
    });

    render(
      <DeploymentExternalLink
        suiteContext={{
          deploymentRef: { id: 'app-1', name: 'App' },
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Open deployment' })).toBeInTheDocument();
    });

    expect(getDeploymentByIdMock).toHaveBeenCalledTimes(1);
    expect(getAllDeploymentsMock).not.toHaveBeenCalled();
  });

  test('renders nothing when lookup fails', async () => {
    getDeploymentByIdMock.mockResolvedValue(null);

    const { container } = render(
      <DeploymentExternalLink
        suiteContext={{
          deploymentRef: { id: 'missing', name: 'Missing' },
        }}
      />,
    );

    await waitFor(() => {
      expect(getDeploymentByIdMock).toHaveBeenCalled();
    });

    expect(screen.queryByRole('button', { name: 'Open deployment' })).not.toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'loading' })).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
    expect(getAllDeploymentsMock).not.toHaveBeenCalled();
  });

  test('skips by-id lookup when type is stored', () => {
    render(
      <DeploymentExternalLink
        suiteContext={{
          deploymentRef: { id: 'app-1', name: 'App', type: DeploymentType.Application },
        }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Open deployment' })).toBeInTheDocument();
    expect(getDeploymentByIdMock).not.toHaveBeenCalled();
    expect(getAllDeploymentsMock).not.toHaveBeenCalled();
  });

  test('skips by-id lookup for MCP suites', () => {
    render(
      <DeploymentExternalLink
        suiteContext={{
          suiteType: SuiteType.McpTool,
          mcpDeploymentRef: { id: 'mcp-1', name: 'MCP Server' },
        }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Open deployment' })).toBeInTheDocument();
    expect(getDeploymentByIdMock).not.toHaveBeenCalled();
    expect(getAllDeploymentsMock).not.toHaveBeenCalled();
  });
});

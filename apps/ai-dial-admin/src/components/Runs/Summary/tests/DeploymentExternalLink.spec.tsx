import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { DeploymentType } from '@/src/models/evaluation/deployment';
import { SuiteType } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';
import DeploymentExternalLink from '../DeploymentExternalLink';

const getDeploymentByIdMock = vi.fn();
const getModelMock = vi.fn();
const getPlatformApplicationMock = vi.fn();
const onOpenInNewTabMock = vi.fn();

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getDeploymentById: (...args: unknown[]) => getDeploymentByIdMock(...args),
}));

vi.mock('@/src/app/[lang]/platform-models/actions', () => ({
  getModel: (...args: unknown[]) => getModelMock(...args),
}));

vi.mock('@/src/app/[lang]/assets-applications/actions', () => ({
  getPlatformApplication: (...args: unknown[]) => getPlatformApplicationMock(...args),
}));

vi.mock('@/src/utils/open-in-new-tab', () => ({
  onOpenInNewTab: (...args: unknown[]) => onOpenInNewTabMock(...args),
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    IconButton: ({ onClick }: { onClick?: () => void }) => (
      <button type="button" aria-label="Open deployment" onClick={onClick} />
    ),
    Spinner: () => <div role="status" aria-label="loading" />,
  };
});

describe('DeploymentExternalLink', () => {
  beforeEach(() => {
    getDeploymentByIdMock.mockReset();
    getModelMock.mockReset();
    getModelMock.mockResolvedValue(null);
    getPlatformApplicationMock.mockReset();
    getPlatformApplicationMock.mockResolvedValue(null);
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

    expect(await screen.findByRole('button', { name: 'Open deployment' })).toBeInTheDocument();

    expect(getDeploymentByIdMock).toHaveBeenCalledTimes(1);
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

    await waitForElementToBeRemoved(() => screen.queryByRole('status', { name: 'loading' }));
    expect(getDeploymentByIdMock).toHaveBeenCalled();

    expect(screen.queryByRole('button', { name: 'Open deployment' })).not.toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'loading' })).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  test('skips by-id lookup when type is stored', async () => {
    render(
      <DeploymentExternalLink
        suiteContext={{
          deploymentRef: { id: 'app-1', name: 'App', type: DeploymentType.Application },
        }}
      />,
    );

    expect(await screen.findByRole('button', { name: 'Open deployment' })).toBeInTheDocument();
    expect(getDeploymentByIdMock).not.toHaveBeenCalled();
  });

  test('opens a platform application when the platform resource exists', async () => {
    getPlatformApplicationMock.mockResolvedValue({ response: { name: 'world-economy-v2-hybrid' } });
    const user = userEvent.setup();

    render(
      <DeploymentExternalLink
        suiteContext={{
          deploymentRef: {
            id: 'world-economy-v2-hybrid',
            name: 'StatGPT',
            type: DeploymentType.Application,
          },
        }}
      />,
    );

    await user.click(await screen.findByRole('button', { name: 'Open deployment' }));

    expect(onOpenInNewTabMock).toHaveBeenCalledWith(ApplicationRoute.AssetsApplications, {
      name: 'world-economy-v2-hybrid',
    });
  });

  test('skips by-id lookup for MCP suites', () => {
    render(
      <DeploymentExternalLink
        suiteContext={{
          suiteType: SuiteType.McpTool,
          mcpDeploymentRef: { id: 'mcp-1', name: 'MCP Server', type: 'mcp' },
        }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Open deployment' })).toBeInTheDocument();
    expect(getDeploymentByIdMock).not.toHaveBeenCalled();
  });
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import ContainerStatusBanner from '@/src/components/Deployments/Common/ContainerStatusBanner/ContainerStatusBanner';
import { Container } from '@/src/models/deployments/containers';
import { CONTAINER_SOURCE_TYPE, CONTAINER_STATUS, CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';

const openInNewTabMock = vi.fn();
vi.mock('@/src/utils/open-in-new-tab', () => ({
  onOpenInNewTab: (...args: unknown[]) => openInNewTabMock(...args),
}));

const protectedRequestMock = vi.fn();
vi.mock('@/src/hooks/use-protected-request', () => ({
  useProtectedRequest: () => protectedRequestMock,
}));

const getContainersByViewMock = vi.fn();
vi.mock('@/src/utils/deployments/containers', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/src/utils/deployments/containers');
  return {
    ...actual,
    getContainersByView: (...args: unknown[]) => getContainersByViewMock(...args),
  };
});

const buildContainer = (overrides: Partial<Container> = {}): Container => ({
  $type: CONTAINER_TYPE.MCP,
  name: 'ykchattest',
  displayName: 'ykchattest',
  status: CONTAINER_STATUS.STOPPED,
  source: { $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE },
  metadata: {},
  ...overrides,
});

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const mockFetchResponse = (containers: Container[] | null) => {
  const stubAction = vi.fn();
  getContainersByViewMock.mockReturnValue(stubAction);
  protectedRequestMock.mockResolvedValue({ success: true, response: containers });
  return stubAction;
};

describe('ContainerStatusBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders nothing while the fetch is in flight', () => {
    const stubAction = vi.fn();
    getContainersByViewMock.mockReturnValue(stubAction);
    protectedRequestMock.mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = render(<ContainerStatusBanner view={ApplicationRoute.Models} containerId="ykchattest" />);
    expect(container.firstChild).toBeNull();
  });

  test('renders nothing when the referenced container is not present in the response', async () => {
    mockFetchResponse([buildContainer({ name: 'other-container' })]);
    const { container } = render(<ContainerStatusBanner view={ApplicationRoute.Models} containerId="ykchattest" />);
    await flush();
    expect(container.firstChild).toBeNull();
  });

  test('renders nothing when the container is running', async () => {
    mockFetchResponse([buildContainer({ status: CONTAINER_STATUS.RUNNING })]);
    const { container } = render(<ContainerStatusBanner view={ApplicationRoute.Models} containerId="ykchattest" />);
    await flush();
    expect(container.firstChild).toBeNull();
  });

  test.each([
    CONTAINER_STATUS.PENDING,
    CONTAINER_STATUS.NOT_DEPLOYED,
    CONTAINER_STATUS.FAILED,
    CONTAINER_STATUS.STOPPED,
    CONTAINER_STATUS.STOPPING,
  ])('renders the banner when the container status is %s', async (status) => {
    mockFetchResponse([buildContainer({ status })]);
    render(<ContainerStatusBanner view={ApplicationRoute.Models} containerId="ykchattest" />);
    await waitFor(() => expect(screen.queryByText('Containers.ContainerNotRunningTitle')).toBeInTheDocument());
    expect(screen.queryByText('Containers.ContainerNotRunningDescription')).toBeInTheDocument();
    expect(screen.queryByText('Containers.GoToContainer')).toBeInTheDocument();
  });

  test('does not render if getContainersByView returns null for an unsupported view', async () => {
    getContainersByViewMock.mockReturnValue(null);
    const { container } = render(<ContainerStatusBanner view={ApplicationRoute.Home} containerId="ykchattest" />);
    await flush();
    expect(container.firstChild).toBeNull();
  });

  test('clicking "Go to Container" opens Model Servings for an inference container', async () => {
    mockFetchResponse([buildContainer({ $type: CONTAINER_TYPE.HF })]);
    render(<ContainerStatusBanner view={ApplicationRoute.Models} containerId="ykchattest" />);
    await waitFor(() => screen.getByText('Containers.GoToContainer'));
    fireEvent.click(screen.getByText('Containers.GoToContainer'));
    expect(openInNewTabMock).toHaveBeenCalledWith(ApplicationRoute.ModelServings, { name: 'ykchattest' });
  });

  test('clicking "Go to Container" opens the correct route for an application container', async () => {
    mockFetchResponse([buildContainer({ $type: CONTAINER_TYPE.APPLICATION })]);
    render(<ContainerStatusBanner view={ApplicationRoute.Applications} containerId="ykchattest" />);
    await waitFor(() => screen.getByText('Containers.GoToContainer'));
    fireEvent.click(screen.getByText('Containers.GoToContainer'));
    expect(openInNewTabMock).toHaveBeenCalledWith(ApplicationRoute.ApplicationContainers, { name: 'ykchattest' });
  });

  test('clicking "Go to Container" opens MCP Containers for an MCP toolset source', async () => {
    mockFetchResponse([buildContainer({ $type: CONTAINER_TYPE.MCP })]);
    render(<ContainerStatusBanner view={ApplicationRoute.Toolsets} containerId="ykchattest" />);
    await waitFor(() => screen.getByText('Containers.GoToContainer'));
    fireEvent.click(screen.getByText('Containers.GoToContainer'));
    expect(openInNewTabMock).toHaveBeenCalledWith(ApplicationRoute.McpContainers, { name: 'ykchattest' });
  });

  test('clicking "Go to Container" opens Model Servings for a Model Serving toolset source', async () => {
    mockFetchResponse([buildContainer({ $type: CONTAINER_TYPE.HF })]);
    render(<ContainerStatusBanner view={ApplicationRoute.Toolsets} containerId="ykchattest" />);
    await waitFor(() => screen.getByText('Containers.GoToContainer'));
    fireEvent.click(screen.getByText('Containers.GoToContainer'));
    expect(openInNewTabMock).toHaveBeenCalledWith(ApplicationRoute.ModelServings, { name: 'ykchattest' });
  });

  test('clicking "Go to Container" opens the correct route for an interceptor container', async () => {
    mockFetchResponse([buildContainer({ $type: CONTAINER_TYPE.INTERCEPTOR })]);
    render(<ContainerStatusBanner view={ApplicationRoute.Interceptors} containerId="ykchattest" />);
    await waitFor(() => screen.getByText('Containers.GoToContainer'));
    fireEvent.click(screen.getByText('Containers.GoToContainer'));
    expect(openInNewTabMock).toHaveBeenCalledWith(ApplicationRoute.InterceptorContainers, { name: 'ykchattest' });
  });

  test('swallows fetch errors silently and renders null', async () => {
    const stubAction = vi.fn();
    getContainersByViewMock.mockReturnValue(stubAction);
    protectedRequestMock.mockRejectedValue(new Error('network down'));
    const { container } = render(<ContainerStatusBanner view={ApplicationRoute.Models} containerId="ykchattest" />);
    await flush();
    expect(container.firstChild).toBeNull();
  });

  test('treats a non-success response as no containers (banner renders null)', async () => {
    const stubAction = vi.fn();
    getContainersByViewMock.mockReturnValue(stubAction);
    protectedRequestMock.mockResolvedValue({
      success: false,
      status: 500,
      errorMessage: 'server error',
      response: [buildContainer()], // payload should be ignored because success === false
    });
    const { container } = render(<ContainerStatusBanner view={ApplicationRoute.Models} containerId="ykchattest" />);
    await flush();
    expect(container.firstChild).toBeNull();
  });
});

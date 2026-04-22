import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HeaderButtons from '../HeaderButtons';
import { ApplicationRoute } from '@/src/types/routes';

vi.mock('@/src/app/actions/deployments');
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({ featureFlags: { mcpRegistryEnabled: true } }),
}));

describe('HeaderButtons', () => {
  const mockToggleColumnsPanel = vi.fn();
  const mockNames = ['container-1', 'container-2'];

  const defaultProps = {
    toggleColumnsPanel: mockToggleColumnsPanel,
    route: ApplicationRoute.ModelServings,
    names: mockNames,
    gridApi: null,
  };

  test('renders create button', () => {
    render(<HeaderButtons {...defaultProps} />);

    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });

  test('renders 3 dropdown items for MCP containers route', async () => {
    const user = userEvent.setup();
    render(<HeaderButtons {...defaultProps} route={ApplicationRoute.McpContainers} />);

    const createButton = screen.getByRole('button', { name: /create/i });
    await user.click(createButton);

    expect(screen.getByText('Containers.FromInternalMcpImage')).toBeInTheDocument();
    expect(screen.getByText('Containers.FromDockerImageReference')).toBeInTheDocument();
    expect(screen.getByText('Containers.FromMcpRegistry')).toBeInTheDocument();
  });

  test('renders application dropdown items for Application Containers route', async () => {
    const user = userEvent.setup();
    render(<HeaderButtons {...defaultProps} route={ApplicationRoute.ApplicationContainers} />);

    const createButton = screen.getByRole('button', { name: /create/i });
    await user.click(createButton);

    expect(screen.getByText('Containers.FromInternalApplicationImage')).toBeInTheDocument();
    expect(screen.getByText('Containers.FromDockerImageReference')).toBeInTheDocument();
  });

  test.skip('opens modal when create button clicked', async () => {
    const user = userEvent.setup();
    render(<HeaderButtons {...defaultProps} />);

    const createButton = screen.getByRole('button', { name: /create/i });
    await user.click(createButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

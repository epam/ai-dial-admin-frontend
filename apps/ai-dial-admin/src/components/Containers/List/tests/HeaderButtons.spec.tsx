import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HeaderButtons from '../HeaderButtons';
import { ApplicationRoute } from '@/src/types/routes';

vi.mock('@/src/app/actions/deployments');

const { mockFeatureFlags } = vi.hoisted(() => ({
  mockFeatureFlags: {
    mcpRegistryEnabled: true,
    nimEnabled: true,
    hfEnabled: true,
  },
}));

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({ featureFlags: mockFeatureFlags }),
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
    mockFeatureFlags.hfEnabled = true;
    mockFeatureFlags.nimEnabled = true;
    render(<HeaderButtons {...defaultProps} />);

    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });

  test('renders 3 dropdown items for MCP containers route', async () => {
    mockFeatureFlags.mcpRegistryEnabled = true;
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

  describe('Model Servings dropdown — feature flag gating', () => {
    const modelServingLabel = 'Entities.ModelServing';

    test('shows both rows when both flags enabled', async () => {
      mockFeatureFlags.hfEnabled = true;
      mockFeatureFlags.nimEnabled = true;
      const user = userEvent.setup();
      render(<HeaderButtons {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /create/i }));

      expect(screen.getAllByText(modelServingLabel)).toHaveLength(2);
    });

    test('shows only one row when only HF is enabled', async () => {
      mockFeatureFlags.hfEnabled = true;
      mockFeatureFlags.nimEnabled = false;
      const user = userEvent.setup();
      render(<HeaderButtons {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /create/i }));

      expect(screen.getAllByText(modelServingLabel)).toHaveLength(1);
    });

    test('shows only one row when only NIM is enabled', async () => {
      mockFeatureFlags.hfEnabled = false;
      mockFeatureFlags.nimEnabled = true;
      const user = userEvent.setup();
      render(<HeaderButtons {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /create/i }));

      expect(screen.getAllByText(modelServingLabel)).toHaveLength(1);
    });

    test('shows no rows when both flags disabled', async () => {
      mockFeatureFlags.hfEnabled = false;
      mockFeatureFlags.nimEnabled = false;
      const user = userEvent.setup();
      render(<HeaderButtons {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /create/i }));

      expect(screen.queryByText(modelServingLabel)).not.toBeInTheDocument();
    });
  });

  test.skip('opens modal when create button clicked', async () => {
    const user = userEvent.setup();
    render(<HeaderButtons {...defaultProps} />);

    const createButton = screen.getByRole('button', { name: /create/i });
    await user.click(createButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

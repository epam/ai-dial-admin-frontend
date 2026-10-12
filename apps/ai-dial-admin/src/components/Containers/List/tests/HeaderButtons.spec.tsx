import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HeaderButtons from '../HeaderButtons';
import { ApplicationRoute } from '@/src/types/routes';
import { CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { ButtonsI18nKey, ContainersI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';

vi.mock('@/src/app/actions/deployments');

vi.mock('@/src/components/Deployments/Modals/ServingCreate', () => ({
  default: ({ names, route, type }: { names: string[]; route: string; type: string }) => (
    <div role="dialog" aria-label="serving-create">
      {`${route}|${type}|${names.join(',')}`}
    </div>
  ),
}));

vi.mock('@/src/components/Deployments/Modals/ContainerCreate', () => ({
  default: ({ names, route }: { names: string[]; route: string }) => (
    <div role="dialog" aria-label="container-create">
      {`${route}|${names.join(',')}`}
    </div>
  ),
}));

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

  describe('unified containers list', () => {
    const allNames = ['adapter-a', 'mcp-a', 'mcp-b'];

    const renderUnified = (props?: { isReadOnlyAdmin?: boolean }) =>
      render(<HeaderButtons {...defaultProps} route={ApplicationRoute.Containers} names={allNames} {...props} />);

    const chooseTypeAndSource = async (
      user: ReturnType<typeof userEvent.setup>,
      type: EntitiesI18nKey,
      source: ContainersI18nKey,
    ) => {
      await user.click(screen.getByRole('button', { name: /create/i }));
      await user.click(screen.getByRole('radio', { name: type }));
      await user.click(screen.getByRole('radio', { name: source }));
      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Next }));
    };

    test('opens the type selector modal instead of a source dropdown', async () => {
      const user = userEvent.setup();
      renderUnified();

      await user.click(screen.getByRole('button', { name: /create/i }));

      expect(screen.getByRole('radio', { name: EntitiesI18nKey.MCP })).toBeInTheDocument();
      expect(screen.queryByText(ContainersI18nKey.FromInternalMcpImage)).not.toBeInTheDocument();
    });

    test('opens the docker-image form for the chosen type validated against every container name', async () => {
      const user = userEvent.setup();
      renderUnified();

      await chooseTypeAndSource(user, EntitiesI18nKey.MCP, ContainersI18nKey.FromDockerImageReference);

      expect(screen.getByRole('dialog', { name: 'serving-create' })).toHaveTextContent(
        `${ApplicationRoute.McpContainers}|${CONTAINER_TYPE.MCP}|${allNames.join(',')}`,
      );
    });

    test('opens the internal-image wizard with the chosen type kind and every container name', async () => {
      const user = userEvent.setup();
      renderUnified();

      await chooseTypeAndSource(user, EntitiesI18nKey.Adapter, ContainersI18nKey.FromInternalAdapterImage);

      expect(screen.getByRole('dialog', { name: 'container-create' })).toHaveTextContent(
        `${ApplicationRoute.AdapterContainers}|${allNames.join(',')}`,
      );
    });

    test('hides the create control for a read-only admin', () => {
      renderUnified({ isReadOnlyAdmin: true });

      expect(screen.queryByRole('button', { name: /create/i })).not.toBeInTheDocument();
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

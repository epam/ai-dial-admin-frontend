import { appContextMock } from '@/test-mocks/app-context';
import { useAppsFolder } from '@/src/context/assets/AppsFolderContext';
import { resolveAppRunnerScheme } from '@/src/components/SourceField/Application/resolve-app-runner';
import { ButtonsI18nKey, EntitiesI18nKey, GrafanaLinksI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { GrafanaTraceLinks } from '@/src/utils/grafana/models';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { DialRole } from '@/src/models/dial/role';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';
import PlatformApplicationView from '../View';

vi.mock('@/src/components/SourceField/Application/resolve-app-runner');

vi.mock('@/src/components/TryOut/Deployment/DeploymentTryOut', () => ({
  default: ({ deployment }: { deployment: string }) => <div>panel:{deployment}</div>,
}));

vi.mock('@/src/context/assets/AppsFolderContext', () => ({
  useAppsFolder: vi.fn(),
  AppsFolderProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/src/app/[lang]/assets-applications/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/app/[lang]/assets-applications/actions')>()),
  removePlatformApplication: vi.fn(),
  updatePlatformApplication: vi.fn(),
}));

const setEntityReadOnly = vi.fn();
beforeEach(() => {
  appContextMock.use(() => ({ setEntityReadOnly, featureFlags: {}, isUnitMode: false, canWriteAt: () => true }));
});

/**
 * Matches `Assets/Entities/Apps/tests/View.spec.tsx`'s scope: a render smoke test, not deep interaction
 * coverage — the component's real dependency surface (`TabsContent`, `SimpleEntityHeader`, tab
 * controls) is exercised at the shared-component level, since this view reuses them unmodified
 * (design.md's Context — core gives platform-bucket applications full field/tab parity).
 */
describe('PlatformApplicationView', () => {
  const mockFetchFiles = vi.fn();

  const mockOriginalApp: AssetApp = {
    name: 'platform-app',
    version: '',
    folderId: 'platform/',
    path: 'platform/platform-app',
    displayName: 'Platform App',
  } as AssetApp;

  const mockModels: DialModel[] = [];
  const mockApplications: DialApplication[] = [];
  const mockSchemes: DialApplicationScheme[] = [];
  const mockRoles: DialRole[] = [];
  const mockInterceptors: DialInterceptor[] = [];
  const mockEtag = 'etag-123';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resolveAppRunnerScheme).mockImplementation(async (runner) => ({ runner }));

    (useAppsFolder as Mock).mockReturnValue({
      fetchFiles: mockFetchFiles,
    });
  });

  test('renders the platform application detail view without crashing', () => {
    render(
      <PlatformApplicationView
        etag={mockEtag}
        originalApp={mockOriginalApp}
        models={mockModels}
        applications={mockApplications}
        schemes={mockSchemes}
        roles={mockRoles}
        interceptors={mockInterceptors}
      />,
    );

    expect(screen.getByText('platform-app')).toBeTruthy();
  });

  test('renders a Roles tab positioned before Interceptors', () => {
    render(
      <PlatformApplicationView
        etag={mockEtag}
        originalApp={mockOriginalApp}
        models={mockModels}
        applications={mockApplications}
        schemes={mockSchemes}
        roles={mockRoles}
        interceptors={mockInterceptors}
      />,
    );

    const tabLabels = screen.getAllByRole('tab').map((tab) => tab.textContent);
    expect(tabLabels.indexOf(TabsI18nKey.Roles)).toBeGreaterThan(-1);
    expect(tabLabels.indexOf(TabsI18nKey.Roles)).toBeLessThan(tabLabels.indexOf(TabsI18nKey.Interceptors));
    expect(tabLabels).not.toContain(TabsI18nKey.Dependencies);
    expect(tabLabels).not.toContain(TabsI18nKey.ResourceDependencies);
  });

  test('renders a Roles tab before Interceptors even when the MCP Tools tab is present', () => {
    render(
      <PlatformApplicationView
        etag={mockEtag}
        originalApp={{ ...mockOriginalApp, mcp: { endpoint: 'http://mcp' } } as AssetApp}
        models={mockModels}
        applications={mockApplications}
        schemes={mockSchemes}
        roles={mockRoles}
        interceptors={mockInterceptors}
      />,
    );

    const tabLabels = screen.getAllByRole('tab').map((tab) => tab.textContent);
    expect(tabLabels.indexOf(TabsI18nKey.Tools)).toBeGreaterThan(-1);
    expect(tabLabels.indexOf(TabsI18nKey.Roles)).toBeLessThan(tabLabels.indexOf(TabsI18nKey.Interceptors));
  });

  test('shows Tools for a runner resolved by schema id without changing the application', async () => {
    const runner: DialApplicationScheme = {
      $id: 'runner-id',
      'dial:applicationTypeMcp': { 'dial:endpoint': 'https://mcp.example.com' },
    };
    vi.mocked(resolveAppRunnerScheme).mockResolvedValue({ scheme: runner });
    const app = { ...mockOriginalApp, application_type_schema_id: 'runner-id' } as AssetApp;

    render(
      <PlatformApplicationView
        etag={mockEtag}
        originalApp={app}
        models={mockModels}
        applications={mockApplications}
        schemes={mockSchemes}
        roles={mockRoles}
        interceptors={mockInterceptors}
      />,
    );

    expect(await screen.findByRole('tab', { name: TabsI18nKey.Tools })).toBeTruthy();
    expect(resolveAppRunnerScheme).toHaveBeenCalledWith({ $id: 'runner-id' });
    expect(app.mcp).toBeUndefined();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).toBeNull();
  });

  test('shows Tools when the matched runner is returned without a resolved scheme', async () => {
    const runner: DialApplicationScheme = {
      $id: 'runner-id',
      'dial:applicationTypeMcp': { 'dial:endpoint': 'https://mcp.example.com' },
    };
    vi.mocked(resolveAppRunnerScheme).mockResolvedValue({ runner });

    render(
      <PlatformApplicationView
        etag={mockEtag}
        originalApp={{ ...mockOriginalApp, application_type_schema_id: 'runner-id' } as AssetApp}
        models={mockModels}
        applications={mockApplications}
        schemes={[runner]}
        roles={mockRoles}
        interceptors={mockInterceptors}
      />,
    );

    expect(await screen.findByRole('tab', { name: TabsI18nKey.Tools })).toBeTruthy();
    expect(resolveAppRunnerScheme).toHaveBeenCalledWith(runner);
  });

  test.each([
    [[], true],
    [['role'], false],
    [undefined, false],
  ])('Should set the Roles tab warning icon presence to %s for user_roles %s', (userRoles, expectedWarning) => {
    render(
      <PlatformApplicationView
        etag={mockEtag}
        originalApp={{ ...mockOriginalApp, user_roles: userRoles } as AssetApp}
        models={mockModels}
        applications={mockApplications}
        schemes={mockSchemes}
        roles={mockRoles}
        interceptors={mockInterceptors}
      />,
    );

    const warnedRolesTab = screen.queryByRole('tab', {
      name: new RegExp(`${TabsI18nKey.Roles}.*${TabsI18nKey.StatusWarning}`),
    });
    expect(!!warnedRolesTab).toBe(expectedWarning);
  });

  test('Should mark the entity read-only when config-file-sourced, and clear it on unmount', () => {
    const { unmount } = render(
      <PlatformApplicationView
        etag={mockEtag}
        originalApp={mockOriginalApp}
        models={mockModels}
        applications={mockApplications}
        schemes={mockSchemes}
        roles={mockRoles}
        interceptors={mockInterceptors}
        isConfigFileSource
      />,
    );

    expect(setEntityReadOnly).toHaveBeenCalledWith(true);

    unmount();

    expect(setEntityReadOnly).toHaveBeenLastCalledWith(false);
  });

  test('Should not mark the entity read-only for an admin-backed application', () => {
    render(
      <PlatformApplicationView
        etag={mockEtag}
        originalApp={mockOriginalApp}
        models={mockModels}
        applications={mockApplications}
        schemes={mockSchemes}
        roles={mockRoles}
        interceptors={mockInterceptors}
      />,
    );

    expect(setEntityReadOnly).toHaveBeenCalledWith(false);
  });

  describe('Grafana trace links', () => {
    const grafanaLinks: GrafanaTraceLinks = {
      allTracesUrl: 'https://grafana.example.com/explore?all',
      errorTracesUrl: 'https://grafana.example.com/explore?errors',
    };

    const renderWithLinks = (links?: GrafanaTraceLinks | null) =>
      render(
        <PlatformApplicationView
          etag={mockEtag}
          originalApp={mockOriginalApp}
          models={mockModels}
          applications={mockApplications}
          schemes={mockSchemes}
          roles={mockRoles}
          interceptors={mockInterceptors}
          grafanaLinks={links}
        />,
      );

    test('shows one Grafana traces control beside Delete when links are provided', () => {
      renderWithLinks(grafanaLinks);

      const trigger = screen.getByRole('button', { name: GrafanaLinksI18nKey.Traces });
      const deleteButtons = screen.getAllByRole('button', { name: ButtonsI18nKey.Delete });

      expect(deleteButtons.some((button) => button.parentElement?.contains(trigger))).toBe(true);
      expect(screen.queryByRole('link')).toBeNull();
    });

    test('shows no links when none are provided', () => {
      renderWithLinks(null);

      expect(screen.queryByRole('button', { name: GrafanaLinksI18nKey.Traces })).toBeNull();
    });

    test('hides the links while the JSON editor is open', async () => {
      const user = userEvent.setup();
      renderWithLinks(grafanaLinks);

      await user.click(screen.getByRole('switch', { name: EntitiesI18nKey.JSONEditor }));

      expect(await screen.findByRole('textbox', { name: 'JSON editor' })).toBeTruthy();
      expect(screen.queryByRole('button', { name: GrafanaLinksI18nKey.Traces })).toBeNull();
    });
  });

  test('shows the Try out button beside Delete', () => {
    render(
      <PlatformApplicationView
        etag={mockEtag}
        originalApp={mockOriginalApp}
        models={mockModels}
        applications={mockApplications}
        schemes={mockSchemes}
        roles={mockRoles}
        interceptors={mockInterceptors}
      />,
    );

    const tryOut = screen.getByRole('button', { name: ButtonsI18nKey.TryOut });
    const deleteButtons = screen.getAllByRole('button', { name: ButtonsI18nKey.Delete });

    expect(deleteButtons.some((button) => button.parentElement?.contains(tryOut))).toBe(true);
  });

  test('opens the Try out panel for the application by its short name', async () => {
    render(
      <PlatformApplicationView
        etag={mockEtag}
        originalApp={{ ...mockOriginalApp, _metadata: { path: 'platform/platform-app' } } as AssetApp}
        models={mockModels}
        applications={mockApplications}
        schemes={mockSchemes}
        roles={mockRoles}
        interceptors={mockInterceptors}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.TryOut }));

    const [content] = appContextMock.sidebar.showSidebar.mock.calls[0];
    render(<>{content}</>);
    expect(screen.getByText('panel:platform-app')).toBeInTheDocument();
  });
});

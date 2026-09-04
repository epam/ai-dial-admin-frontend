import { useAppsFolder } from '@/src/context/assets/AppsFolderContext';
import { TabsI18nKey } from '@/src/constants/i18n';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { DialRole } from '@/src/models/dial/role';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';
import PlatformApplicationView from '../View';

vi.mock('@/src/context/assets/AppsFolderContext', () => ({
  useAppsFolder: vi.fn(),
}));

vi.mock('@/src/app/[lang]/assets-applications/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/app/[lang]/assets-applications/actions')>()),
  removePlatformApplication: vi.fn(),
  updatePlatformApplication: vi.fn(),
}));

/**
 * Matches `Assets/Apps/tests/View.spec.tsx`'s scope: a render smoke test, not deep interaction
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
});

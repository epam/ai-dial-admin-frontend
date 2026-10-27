import { useAppsFolder } from '@/src/context/assets/AppsFolderContext';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { updateApp, moveApps } from '@/src/app/[lang]/assets-applications/actions';
import { ButtonsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';
import AppView from '@/src/components/Assets/Entities/Apps/View';

// Mock dependencies

vi.mock('@/src/context/assets/AppsFolderContext', () => ({
  useAppsFolder: vi.fn(),
}));

vi.mock('@/src/app/[lang]/assets-applications/actions', () => ({
  getApps: vi.fn(),
  moveApps: vi.fn(),
  removeApp: vi.fn(),
  updateApp: vi.fn(),
  getApp: vi.fn(),
  createApp: vi.fn(),
  importApps: vi.fn(),
  exportApps: vi.fn(),
  bulkDeleteApps: vi.fn(),
  getPlatformApplication: vi.fn(),
  createPlatformApplication: vi.fn(),
  bulkDeletePlatformApplications: vi.fn(),
}));

vi.mock('@/src/app/[lang]/assets-toolsets/actions', () => ({
  getToolset: vi.fn(),
  createToolset: vi.fn(),
  exportToolsets: vi.fn(),
  importToolsets: vi.fn(),
  moveToolsets: vi.fn(),
  bulkDeleteToolsets: vi.fn(),
  getPlatformToolset: vi.fn(),
  createPlatformToolset: vi.fn(),
  bulkDeletePlatformToolsets: vi.fn(),
}));

describe('AppView', () => {
  const mockFetchFiles = vi.fn();
  const push = vi.fn();
  const refresh = vi.fn();

  const mockOriginalApp: AssetApp = {
    id: 'app-1',
    name: 'Test App',
    version: '1.0.0',
    folderId: '/folder/',
    path: 'public/team/assistant__stable',
    display_version: 'Spring release',
    _metadata: { name: 'Test App', path: 'public/team/assistant__stable', folderId: '/folder/', version: 'stable' },
    displayName: 'Test Application',
  } as AssetApp;

  const mockModels: DialModel[] = [];
  const mockApplications: DialApplication[] = [];
  const mockSchemes: DialApplicationScheme[] = [];
  const mockInterceptors: DialInterceptor[] = [];
  const mockEtag = 'etag-123';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push, refresh } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(updateApp).mockResolvedValue({ success: true });
    vi.mocked(moveApps).mockResolvedValue([{ success: true }]);

    (useAppsFolder as Mock).mockReturnValue({
      fetchFiles: mockFetchFiles,
    });
  });

  const renderView = () =>
    render(
      <AppView
        etag={mockEtag}
        originalApp={mockOriginalApp}
        models={mockModels}
        applications={mockApplications}
        schemes={mockSchemes}
        interceptors={mockInterceptors}
      />,
    );

  test('shows readonly path Version without sibling controls', () => {
    renderView();
    expect(screen.getByText('stable')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /version/i })).toBeNull();
  });

  test('freezes JSON identity while preserving independent display version on save', async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(screen.getByRole('switch', { name: EntitiesI18nKey.JSONEditor }));
    const editor = await screen.findByRole('textbox', { name: 'JSON editor' });
    fireEvent.change(editor, {
      target: {
        value: JSON.stringify({
          ...mockOriginalApp,
          version: 'forged',
          path: 'public/forged__forged',
          display_version: '',
          _metadata: { ...mockOriginalApp._metadata, version: 'forged', path: 'public/forged__forged' },
        }),
      },
    });
    expect(screen.queryByText('stable')).toBeNull();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.SaveAsNewVersion })).toBeNull();
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));
    await vi.waitFor(() =>
      expect(updateApp).toHaveBeenCalledWith(
        expect.objectContaining({
          path: mockOriginalApp.path,
          version: mockOriginalApp.version,
          _metadata: mockOriginalApp._metadata,
          display_version: '',
        }),
        mockEtag,
      ),
    );
  });

  test('moves only the opened resource and preserves its suffix', async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(screen.getByRole('switch', { name: EntitiesI18nKey.JSONEditor }));
    fireEvent.change(await screen.findByRole('textbox', { name: 'JSON editor' }), {
      target: { value: JSON.stringify({ ...mockOriginalApp, folderId: 'public/new/' }) },
    });
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));
    await vi.waitFor(() =>
      expect(moveApps).toHaveBeenCalledExactlyOnceWith(['public/team/assistant__stable'], 'public/new'),
    );
  });
});

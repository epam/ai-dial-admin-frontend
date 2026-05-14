import { useAppsFolder } from '@/src/context/assets/AppsFolderContext';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { render } from '@testing-library/react';
import { beforeEach, describe, Mock, test, vi } from 'vitest';
import AppView from '../View';

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
}));

describe('AppView', () => {
  const mockFetchFiles = vi.fn();

  const mockOriginalApp: AssetApp = {
    id: 'app-1',
    name: 'Test App',
    version: '1.0.0',
    folderId: '/folder/',
    path: '/folder/app-1',
    displayName: 'Test Application',
  } as AssetApp;

  const mockAssets: AssetApp[] = [mockOriginalApp];
  const mockModels: DialModel[] = [];
  const mockApplications: DialApplication[] = [];
  const mockSchemes: DialApplicationScheme[] = [];
  const mockInterceptors: DialInterceptor[] = [];
  const mockEtag = 'etag-123';

  beforeEach(() => {
    vi.clearAllMocks();

    (useAppsFolder as Mock).mockReturnValue({
      fetchFiles: mockFetchFiles,
    });
  });

  test('should render AssetHeader component', () => {
    render(
      <AppView
        etag={mockEtag}
        originalApp={mockOriginalApp}
        assets={mockAssets}
        models={mockModels}
        applications={mockApplications}
        schemes={mockSchemes}
        interceptors={mockInterceptors}
      />,
    );
  });
});

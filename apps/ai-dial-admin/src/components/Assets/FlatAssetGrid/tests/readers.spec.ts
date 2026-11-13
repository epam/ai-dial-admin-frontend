import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getConfigFileModels, getModels } from '@/src/app/[lang]/platform-models/actions';
import { getPolicies } from '@/src/app/[lang]/platform-policies/actions';
import { AssetListItem, BucketType } from '@/src/models/dial/asset-list-item';
import { AssetSource } from '@/src/models/dial/asset-source';
import { DialFileNodeType } from '@/src/models/dial/file';
import { ConfigFileFailureReason } from '@/src/types/config-file-entity';
import { ApplicationRoute } from '@/src/types/routes';
import { readFlatAssets } from '../readers';

vi.mock('@/src/app/[lang]/assets-applications/actions', () => ({
  getApps: vi.fn(),
  getConfigFileApplications: vi.fn(),
}));
vi.mock('@/src/app/[lang]/assets-toolsets/actions', () => ({
  getToolsets: vi.fn(),
  getConfigFileToolsets: vi.fn(),
}));
vi.mock('@/src/app/[lang]/platform-app-runners/actions', () => ({
  getRunners: vi.fn(),
  getConfigFileAppRunners: vi.fn(),
}));
vi.mock('@/src/app/[lang]/platform-catalog-schemas/actions', () => ({
  getCatalogSchemas: vi.fn(),
  getConfigFileCatalogSchemas: vi.fn(),
}));
vi.mock('@/src/app/[lang]/platform-interceptors/actions', () => ({
  getInterceptors: vi.fn(),
  getConfigFileInterceptors: vi.fn(),
}));
vi.mock('@/src/app/[lang]/platform-keys/actions', () => ({ getKeys: vi.fn() }));
vi.mock('@/src/app/[lang]/platform-models/actions', () => ({
  getModels: vi.fn(),
  getConfigFileModels: vi.fn(),
}));
vi.mock('@/src/app/[lang]/platform-policies/actions', () => ({ getPolicies: vi.fn() }));
vi.mock('@/src/app/[lang]/platform-policy-assignments/actions', () => ({ getPolicyAssignments: vi.fn() }));
vi.mock('@/src/app/[lang]/platform-roles/actions', () => ({ getRoles: vi.fn(), getConfigFileRoles: vi.fn() }));
vi.mock('@/src/app/[lang]/platform-routers/actions', () => ({
  getRouters: vi.fn(),
  getConfigFileRouters: vi.fn(),
}));
vi.mock('@/src/app/[lang]/platform-routes/actions', () => ({ getRoutes: vi.fn(), getConfigFileRoutes: vi.fn() }));
vi.mock('@/src/app/[lang]/platform-translators/actions', () => ({
  getTranslators: vi.fn(),
  getConfigFileTranslators: vi.fn(),
}));

const item = (path: string, nodeType = DialFileNodeType.ITEM): AssetListItem => ({
  name: path.split('/').filter(Boolean).pop() as string,
  path,
  nodeType,
  bucket: BucketType.Platform,
});

describe('readFlatAssets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('reads a flat platform list from the platform root', async () => {
    const rows = [item('platform/a'), item('platform/b')];
    vi.mocked(getModels).mockResolvedValue(rows as never);

    const result = await readFlatAssets(ApplicationRoute.PlatformModels, AssetSource.Platform);

    expect(getModels).toHaveBeenCalledWith('platform/');
    expect(result).toEqual({ success: true, rows });
  });

  test('reads a missing listing as an empty successful list', async () => {
    vi.mocked(getModels).mockResolvedValue(null as never);

    expect(await readFlatAssets(ApplicationRoute.PlatformModels, AssetSource.Platform)).toEqual({
      success: true,
      rows: [],
    });
  });

  test('flattens nested cost-object folders into records and drops the folder rows', async () => {
    const globalPolicy = item('platform/daily-cap');
    const teamPolicy = item('platform/team-a/team-cap');
    vi.mocked(getPolicies).mockImplementation((async (path: string) =>
      path === 'platform/'
        ? [globalPolicy, item('platform/team-a/', DialFileNodeType.FOLDER)]
        : [teamPolicy]) as never);

    const result = await readFlatAssets(ApplicationRoute.PlatformPolicies, AssetSource.Platform);

    expect(getPolicies).toHaveBeenCalledWith('platform/team-a/');
    expect(result).toEqual({ success: true, rows: [globalPolicy, teamPolicy] });
  });

  test('maps config.json names to rows sourced from the file', async () => {
    vi.mocked(getConfigFileModels).mockResolvedValue({ success: true, data: ['gpt', 'claude'] });

    const result = await readFlatAssets(ApplicationRoute.PlatformModels, AssetSource.ConfigFile);

    expect(result.success).toBe(true);
    expect(result.success && result.rows).toEqual([
      expect.objectContaining({ name: 'gpt', path: 'gpt', entitySource: 'file' }),
      expect.objectContaining({ name: 'claude', path: 'claude', entitySource: 'file' }),
    ]);
  });

  test('reports a failed config.json read with its error, not as an empty list', async () => {
    vi.mocked(getConfigFileModels).mockResolvedValue({
      success: false,
      failure: { reason: ConfigFileFailureReason.RequestFailed, errorHeader: 'Boom', errorMessage: 'No access' },
    });

    expect(await readFlatAssets(ApplicationRoute.PlatformModels, AssetSource.ConfigFile)).toEqual({
      success: false,
      errorHeader: 'Boom',
      errorMessage: 'No access',
    });
  });

  test('fails for a view with no reader and for a view with no config.json source', async () => {
    expect(await readFlatAssets(ApplicationRoute.Models, AssetSource.Platform)).toEqual({ success: false });
    expect(await readFlatAssets(ApplicationRoute.PlatformKeys, AssetSource.ConfigFile)).toEqual({ success: false });
  });
});

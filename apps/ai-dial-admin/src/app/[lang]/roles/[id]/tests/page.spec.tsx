import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('next/headers', () => ({ headers: vi.fn(), cookies: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn(), notFound: vi.fn() }));
vi.mock('@/src/utils/auth/auth-request', () => ({ getUserToken: vi.fn().mockResolvedValue('token') }));
vi.mock('@/src/utils/env/get-auth-toggle', () => ({ getIsEnableAuthToggle: vi.fn().mockReturnValue(false) }));
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn() }));
vi.mock('@/src/components/Roles/View/View', () => ({ __esModule: true, default: () => null }));

vi.mock('@/src/app/[lang]/models/actions', () => ({ getModelsList: vi.fn().mockResolvedValue([]) }));
vi.mock('@/src/app/[lang]/roles/actions', () => ({ getConfigFileRole: vi.fn() }));
vi.mock('@/src/app/api/api', () => ({
  rolesApi: {
    getRolesList: vi.fn().mockResolvedValue([]),
    getRole: vi.fn().mockResolvedValue({ etag: 'e', response: { name: 'my-role' } }),
  },
  keysApi: { getKeysList: vi.fn().mockResolvedValue([]) },
  applicationsApi: { getApplicationsList: vi.fn().mockResolvedValue([]) },
  toolSetsApi: { getToolsetList: vi.fn().mockResolvedValue([]) },
  routesApi: { getRoutesList: vi.fn().mockResolvedValue([]) },
}));
vi.mock('@/src/server/config-entities/read-page-options', () => ({
  readConfigEntities: vi.fn().mockResolvedValue([]),
}));

import { getConfigFileRole } from '@/src/app/[lang]/roles/actions';
import { keysApi, rolesApi } from '@/src/app/api/api';
import { redirect } from 'next/navigation';
import Page from '../page';

const renderPage = (searchParams: Record<string, string> = {}) =>
  Page({ params: Promise.resolve({ id: 'my-role' }), searchParams: Promise.resolve(searchParams) });

describe('roles/[id] page — configFile fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('redirects home when the admin API is unset and configFile is not set', async () => {
    vi.stubEnv('DIAL_ADMIN_API_URL', undefined);

    await renderPage();

    expect(redirect).toHaveBeenCalled();
  });

  test('renders instead of redirecting when configFile=true, without the admin API', async () => {
    vi.stubEnv('DIAL_ADMIN_API_URL', undefined);
    vi.mocked(getConfigFileRole).mockResolvedValue({ success: true, data: { name: 'my-role' } as any });

    await renderPage({ configFile: 'true' });

    expect(redirect).not.toHaveBeenCalled();
    expect(getConfigFileRole).toHaveBeenCalledWith('my-role');
    expect(rolesApi.getRole).not.toHaveBeenCalled();
    expect(keysApi.getKeysList).not.toHaveBeenCalled();
  });

  test('uses the admin-backend read path when configFile is absent and the admin API is set', async () => {
    vi.stubEnv('DIAL_ADMIN_API_URL', 'https://admin-be.example.com');

    await renderPage();

    expect(rolesApi.getRole).toHaveBeenCalled();
    expect(getConfigFileRole).not.toHaveBeenCalled();
  });
});

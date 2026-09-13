import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('next/headers', () => ({ headers: vi.fn(), cookies: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn(), notFound: vi.fn() }));
vi.mock('@/src/utils/auth/auth-request', () => ({ getUserToken: vi.fn().mockResolvedValue('token') }));
vi.mock('@/src/utils/env/get-auth-toggle', () => ({ getIsEnableAuthToggle: vi.fn().mockReturnValue(false) }));
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn() }));
vi.mock('@/src/components/Models/View/View', () => ({ __esModule: true, default: () => null }));

vi.mock('@/src/app/[lang]/models/actions', () => ({
  getModelsList: vi.fn().mockResolvedValue([]),
  getModel: vi.fn().mockResolvedValue({ etag: 'e', response: { name: 'my-model' } }),
  getConfigFileModel: vi.fn(),
}));
vi.mock('@/src/app/api/api', () => ({
  rolesApi: { getRolesList: vi.fn().mockResolvedValue([]) },
  interceptorsApi: { getInterceptorsList: vi.fn().mockResolvedValue([]) },
}));
vi.mock('@/src/server/config-entities/read-page-options', () => ({
  readConfigEntities: vi.fn().mockResolvedValue([]),
}));

import { getConfigFileModel, getModel, getModelsList } from '@/src/app/[lang]/models/actions';
import { rolesApi, interceptorsApi } from '@/src/app/api/api';
import { readConfigEntities } from '@/src/server/config-entities/read-page-options';
import { redirect } from 'next/navigation';
import Page from '../page';

const renderPage = (searchParams: Record<string, string> = {}) =>
  Page({ params: Promise.resolve({ id: 'my-model' }), searchParams: Promise.resolve(searchParams) });

describe('models/[id] page — configFile fallback', () => {
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

  test('renders instead of redirecting when configFile=true, even without the admin API', async () => {
    vi.stubEnv('DIAL_ADMIN_API_URL', undefined);
    vi.mocked(getConfigFileModel).mockResolvedValue({ success: true, data: { name: 'my-model' } as any });

    await renderPage({ configFile: 'true' });

    expect(redirect).not.toHaveBeenCalled();
    expect(getConfigFileModel).toHaveBeenCalledWith('my-model');
    expect(getModel).not.toHaveBeenCalled();
  });

  test('reads roles/interceptors through the config-file-aware picker read when in config-file mode', async () => {
    vi.stubEnv('DIAL_ADMIN_API_URL', undefined);
    vi.mocked(getConfigFileModel).mockResolvedValue({ success: true, data: { name: 'my-model' } as any });

    await renderPage({ configFile: 'true' });

    expect(readConfigEntities).toHaveBeenCalledWith(expect.anything(), 'roles', [], true);
    expect(readConfigEntities).toHaveBeenCalledWith(expect.anything(), 'interceptors', [], true);
    expect(rolesApi.getRolesList).not.toHaveBeenCalled();
    expect(interceptorsApi.getInterceptorsList).not.toHaveBeenCalled();
  });

  test('uses the admin-backend read path when configFile is absent and the admin API is set', async () => {
    vi.stubEnv('DIAL_ADMIN_API_URL', 'https://admin-be.example.com');

    await renderPage();

    expect(getModel).toHaveBeenCalledWith('my-model', '*');
    expect(getConfigFileModel).not.toHaveBeenCalled();
    expect(rolesApi.getRolesList).toHaveBeenCalled();
    expect(interceptorsApi.getInterceptorsList).toHaveBeenCalled();
  });
});

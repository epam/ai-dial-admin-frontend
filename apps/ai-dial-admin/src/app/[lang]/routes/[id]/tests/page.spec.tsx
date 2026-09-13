import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('next/headers', () => ({ headers: vi.fn(), cookies: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn(), notFound: vi.fn() }));
vi.mock('@/src/utils/auth/auth-request', () => ({ getUserToken: vi.fn().mockResolvedValue('token') }));
vi.mock('@/src/utils/env/get-auth-toggle', () => ({ getIsEnableAuthToggle: vi.fn().mockReturnValue(false) }));
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn() }));
vi.mock('@/src/components/Routes/View/View', () => ({ __esModule: true, default: () => null }));

vi.mock('@/src/app/[lang]/routes/actions', () => ({ getConfigFileRoute: vi.fn() }));
vi.mock('@/src/app/api/api', () => ({
  routesApi: {
    getRoutesList: vi.fn().mockResolvedValue([]),
    getRoute: vi.fn().mockResolvedValue({ etag: 'e', response: { name: 'my-route' } }),
  },
  rolesApi: { getRolesList: vi.fn().mockResolvedValue([]) },
}));
vi.mock('@/src/server/config-entities/read-page-options', () => ({
  readConfigEntities: vi.fn().mockResolvedValue([]),
}));

import { getConfigFileRoute } from '@/src/app/[lang]/routes/actions';
import { routesApi } from '@/src/app/api/api';
import { redirect } from 'next/navigation';
import Page from '../page';

const renderPage = (searchParams: Record<string, string> = {}) =>
  Page({ params: Promise.resolve({ id: 'my-route' }), searchParams: Promise.resolve(searchParams) });

describe('routes/[id] page — configFile fallback', () => {
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
    vi.mocked(getConfigFileRoute).mockResolvedValue({ success: true, data: { name: 'my-route' } as any });

    await renderPage({ configFile: 'true' });

    expect(redirect).not.toHaveBeenCalled();
    expect(getConfigFileRoute).toHaveBeenCalledWith('my-route');
    expect(routesApi.getRoute).not.toHaveBeenCalled();
  });

  test('uses the admin-backend read path when configFile is absent and the admin API is set', async () => {
    vi.stubEnv('DIAL_ADMIN_API_URL', 'https://admin-be.example.com');

    await renderPage();

    expect(routesApi.getRoute).toHaveBeenCalled();
    expect(getConfigFileRoute).not.toHaveBeenCalled();
  });
});

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('next/headers', () => ({ headers: vi.fn(), cookies: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn(), notFound: vi.fn() }));
vi.mock('@/src/utils/auth/auth-request', () => ({ getUserToken: vi.fn().mockResolvedValue('token') }));
vi.mock('@/src/utils/env/get-auth-toggle', () => ({ getIsEnableAuthToggle: vi.fn().mockReturnValue(false) }));
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn() }));
vi.mock('@/src/components/Applications/View/View', () => ({ __esModule: true, default: () => null }));

vi.mock('@/src/app/[lang]/models/actions', () => ({ getModelsList: vi.fn().mockResolvedValue([]) }));
vi.mock('@/src/app/[lang]/applications/actions', () => ({ getConfigFileApplication: vi.fn() }));
vi.mock('@/src/app/api/api', () => ({
  applicationsApi: {
    getApplicationsList: vi.fn().mockResolvedValue([]),
    getApplication: vi.fn().mockResolvedValue({ etag: 'e', response: { name: 'my-app' } }),
  },
  applicationRunnersApi: { getApplicationSchemesList: vi.fn().mockResolvedValue([]) },
  interceptorsApi: { getInterceptorsList: vi.fn().mockResolvedValue([]) },
  rolesApi: { getRolesList: vi.fn().mockResolvedValue([]) },
}));
vi.mock('@/src/server/config-entities/read-page-options', () => ({
  readConfigEntities: vi.fn().mockResolvedValue([]),
}));

import { getConfigFileApplication } from '@/src/app/[lang]/applications/actions';
import { applicationsApi, applicationRunnersApi } from '@/src/app/api/api';
import { redirect } from 'next/navigation';
import Page from '../page';

const renderPage = (searchParams: Record<string, string> = {}) =>
  Page({ params: Promise.resolve({ id: 'my-app' }), searchParams: Promise.resolve(searchParams) });

describe('applications/[id] page — configFile fallback', () => {
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
    vi.mocked(getConfigFileApplication).mockResolvedValue({ success: true, data: { name: 'my-app' } as any });

    await renderPage({ configFile: 'true' });

    expect(redirect).not.toHaveBeenCalled();
    expect(getConfigFileApplication).toHaveBeenCalledWith('my-app');
    expect(applicationsApi.getApplication).not.toHaveBeenCalled();
    expect(applicationRunnersApi.getApplicationSchemesList).not.toHaveBeenCalled();
  });

  test('uses the admin-backend read path when configFile is absent and the admin API is set', async () => {
    vi.stubEnv('DIAL_ADMIN_API_URL', 'https://admin-be.example.com');

    await renderPage();

    expect(applicationsApi.getApplication).toHaveBeenCalled();
    expect(getConfigFileApplication).not.toHaveBeenCalled();
  });
});

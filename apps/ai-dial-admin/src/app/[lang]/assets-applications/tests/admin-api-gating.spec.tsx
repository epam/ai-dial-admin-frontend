import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('next/headers', () => ({ headers: vi.fn(), cookies: vi.fn() }));
vi.mock('@/src/utils/auth/auth-request', () => ({ getUserToken: vi.fn().mockResolvedValue('token') }));
vi.mock('@/src/utils/env/get-auth-toggle', () => ({ getIsEnableAuthToggle: vi.fn().mockReturnValue(false) }));
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn() }));

vi.mock('@/src/app/api/api', () => ({
  applicationRunnersApi: { getApplicationSchemesList: vi.fn().mockResolvedValue([]) },
  applicationsApi: { getApplicationsList: vi.fn().mockResolvedValue([]) },
}));
vi.mock('@/src/app/[lang]/platform-app-runners/actions', () => ({ getAllRunners: vi.fn().mockResolvedValue([]) }));
vi.mock('@/src/components/Assets/Apps/PageList', () => ({ __esModule: true, default: () => null }));

vi.mock('@/src/app/[lang]/assets-applications/actions', () => ({
  getApp: vi.fn().mockResolvedValue({ etag: 'e', response: { name: 'my-app', folderId: 'f' } }),
  getApps: vi.fn().mockResolvedValue([]),
  getPlatformApplication: vi.fn().mockResolvedValue({ etag: 'e', response: { name: 'my-app' } }),
}));
vi.mock('@/src/app/[lang]/models/actions', () => ({ getModelsList: vi.fn().mockResolvedValue([]) }));
vi.mock('@/src/app/[lang]/platform-translators/actions', () => ({ getTranslators: vi.fn().mockResolvedValue([]) }));
vi.mock('@/src/server/config-entities/read-page-options', () => ({
  readConfigEntities: vi.fn().mockResolvedValue([]),
  readGlobalInterceptors: vi.fn().mockResolvedValue([]),
}));
vi.mock('@/src/components/Assets/Apps/View', () => ({ __esModule: true, default: () => null }));
vi.mock('@/src/components/Assets/Platform/Applications/View', () => ({ __esModule: true, default: () => null }));

import { applicationRunnersApi, applicationsApi } from '@/src/app/api/api';
import ListPage from '@/src/app/[lang]/assets-applications/page';
import DetailPage from '@/src/app/[lang]/assets-applications/[id]/page';

describe('Assets > Applications :: admin API gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('list page', () => {
    test('skips the admin-backend runner-schemes call when DIAL_ADMIN_API_URL is unset', async () => {
      vi.stubEnv('DIAL_ADMIN_API_URL', undefined);

      await ListPage();

      expect(applicationRunnersApi.getApplicationSchemesList).not.toHaveBeenCalled();
    });

    test('calls the admin-backend runner-schemes call when DIAL_ADMIN_API_URL is set', async () => {
      vi.stubEnv('DIAL_ADMIN_API_URL', 'https://admin-be.example.com');

      await ListPage();

      expect(applicationRunnersApi.getApplicationSchemesList).toHaveBeenCalledOnce();
    });
  });

  describe('detail page', () => {
    const renderDetailPage = () =>
      DetailPage({
        params: Promise.resolve({ id: 'my-app' }),
        searchParams: Promise.resolve({}),
      });

    test('skips both admin-backend calls when DIAL_ADMIN_API_URL is unset', async () => {
      vi.stubEnv('DIAL_ADMIN_API_URL', undefined);

      await renderDetailPage();

      expect(applicationRunnersApi.getApplicationSchemesList).not.toHaveBeenCalled();
      expect(applicationsApi.getApplicationsList).not.toHaveBeenCalled();
    });

    test('calls both admin-backend calls when DIAL_ADMIN_API_URL is set', async () => {
      vi.stubEnv('DIAL_ADMIN_API_URL', 'https://admin-be.example.com');

      await renderDetailPage();

      expect(applicationRunnersApi.getApplicationSchemesList).toHaveBeenCalledOnce();
      expect(applicationsApi.getApplicationsList).toHaveBeenCalledOnce();
    });
  });
});

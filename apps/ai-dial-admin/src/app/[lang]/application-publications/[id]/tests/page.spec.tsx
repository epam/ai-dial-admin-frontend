import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('next/headers', () => ({ headers: vi.fn(), cookies: vi.fn() }));
vi.mock('next/navigation', () => ({ notFound: vi.fn() }));
vi.mock('@/src/utils/auth/auth-request', () => ({ getUserToken: vi.fn().mockResolvedValue('token') }));
vi.mock('@/src/utils/env/get-auth-toggle', () => ({ getIsEnableAuthToggle: vi.fn().mockReturnValue(false) }));
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn() }));
vi.mock('@/src/app/api/api', () => ({
  applicationRunnersApi: { getApplicationSchemesList: vi.fn().mockResolvedValue([{ $id: 'admin-scheme' }]) },
  publicationsApi: { getPublication: vi.fn().mockResolvedValue({}) },
}));
vi.mock('@/src/app/[lang]/platform-app-runners/actions', () => ({
  getAllRunners: vi.fn().mockResolvedValue([{ name: 'platform-runner', path: 'platform-runner' }]),
}));
vi.mock('@/src/server/config-entities/read-page-options', () => ({
  readConfigEntities: vi.fn().mockResolvedValue([{ name: 'core-scheme' }]),
}));
vi.mock('@/src/components/Publications/View/View', () => ({
  __esModule: true,
  default: ({ applicationSchemes }: { applicationSchemes: { $id?: string }[] }) => (
    <div>{applicationSchemes.map((scheme) => scheme.$id).join(',')}</div>
  ),
}));

import { applicationRunnersApi } from '@/src/app/api/api';
import Page from '@/src/app/[lang]/application-publications/[id]/page';
import { getAllRunners } from '@/src/app/[lang]/platform-app-runners/actions';
import { readConfigEntities } from '@/src/server/config-entities/read-page-options';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';

describe('Application publications detail page', () => {
  const renderPage = async () => render(await Page({ searchParams: Promise.resolve({ path: 'publication-path' }) }));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('loads Core schemas and platform runners when the Admin API URL is unset', async () => {
    vi.stubEnv('DIAL_ADMIN_API_URL', undefined);

    await renderPage();

    expect(applicationRunnersApi.getApplicationSchemesList).not.toHaveBeenCalled();
    expect(readConfigEntities).toHaveBeenCalledWith('token', ConfigFileEntityType.Schemas, [], true);
    expect(getAllRunners).toHaveBeenCalledOnce();
    expect(screen.getByText('core-scheme,platform-runner')).toBeInTheDocument();
  });

  test('loads Admin schemas and platform runners when the Admin API URL is configured', async () => {
    vi.stubEnv('DIAL_ADMIN_API_URL', 'https://admin-be.example.com');

    await renderPage();

    expect(applicationRunnersApi.getApplicationSchemesList).toHaveBeenCalledWith('token');
    expect(readConfigEntities).not.toHaveBeenCalled();
    expect(getAllRunners).toHaveBeenCalledOnce();
    expect(screen.getByText('admin-scheme,platform-runner')).toBeInTheDocument();
  });
});

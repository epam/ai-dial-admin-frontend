import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Page from '@/src/app/[lang]/assets-applications/[id]/page';

vi.mock('next/headers', () => ({ headers: vi.fn(), cookies: vi.fn() }));
vi.mock('@/src/utils/auth/auth-request', () => ({ getUserToken: vi.fn().mockResolvedValue('token') }));
vi.mock('@/src/utils/env/get-auth-toggle', () => ({ getIsEnableAuthToggle: vi.fn().mockReturnValue(false) }));
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn() }));

vi.mock('@/src/app/[lang]/assets-applications/actions', () => ({
  getApp: vi.fn(),
  getApps: vi.fn(),
  getPlatformApplication: vi.fn(),
}));
vi.mock('@/src/app/[lang]/models/actions', () => ({ getModelsList: vi.fn().mockResolvedValue([]) }));
vi.mock('@/src/app/[lang]/platform-app-runners/actions', () => ({ getAllRunners: vi.fn().mockResolvedValue([]) }));
vi.mock('@/src/app/api/api', () => ({
  applicationRunnersApi: { getApplicationSchemesList: vi.fn().mockResolvedValue([]) },
  applicationsApi: { getApplicationsList: vi.fn().mockResolvedValue([]) },
}));
vi.mock('@/src/server/catalog-schemas/read-options', () => ({
  readCatalogSchemaOptions: vi.fn().mockResolvedValue({ options: [] }),
}));
vi.mock('@/src/server/config-entities/read-page-options', () => ({
  readConfigEntities: vi.fn().mockResolvedValue([]),
  readGlobalInterceptors: vi.fn().mockResolvedValue([]),
}));
vi.mock('@/src/components/Assets/Entities/Apps/View', () => ({ default: () => <div /> }));
vi.mock('@/src/components/Assets/Platform/Applications/View', () => ({ default: () => <div /> }));

import { getApp, getPlatformApplication } from '@/src/app/[lang]/assets-applications/actions';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { CoreResourceEntityMetadata, DialPlatformApplicationResource } from '@/src/models/dial/resource';
import { GrafanaTraceLinks } from '@/src/utils/grafana/models';

const GRAFANA_TRACES_URL = 'https://grafana.example.com/';

const metadata = (path?: string): CoreResourceEntityMetadata | undefined =>
  path ? { name: 'ahQuickApp', path, folderId: 'public/' } : undefined;

const mergedEntity = (path?: string) => ({ name: 'ahQuickApp', _metadata: metadata(path) });

const mergedApp = (path?: string) => mergedEntity(path) as unknown as AssetApp;

const mergedPlatformApp = (path?: string) => mergedEntity(path) as unknown as DialPlatformApplicationResource;

type RenderedElement = { props: { children: { props: { grafanaLinks?: GrafanaTraceLinks | null } } } };

const renderPage = async (path?: string) =>
  (await Page({
    params: Promise.resolve({ id: 'ahQuickApp' }),
    searchParams: Promise.resolve({ path }),
  })) as unknown as RenderedElement;

const getLinks = (page: RenderedElement) => page.props.children.props.grafanaLinks;

const getQuery = (url: string): string => {
  const encoded = new URL(url).search.match(/panes=([^&]*)/)?.[1] ?? '';
  return JSON.parse(decodeURIComponent(encoded)).a.queries[0].query;
};

describe('assets-applications detail page — Grafana links', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('GRAFANA_TRACES_URL', GRAFANA_TRACES_URL);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('passes links built from the public application path to the public-bucket view', async () => {
    vi.mocked(getApp).mockResolvedValue({
      success: true,
      etag: 'e',
      response: mergedApp('public/ahQuickApp__1.0.0'),
    });

    const links = getLinks(await renderPage('public/ahQuickApp__1.0.0'));

    expect(links?.allTracesUrl.startsWith('https://grafana.example.com/explore?')).toBe(true);
    expect(getQuery(links?.allTracesUrl ?? '')).toBe(
      '{ span.dial.deployment =~ ".*public/ahQuickApp__1\\\\.0\\\\.0" }',
    );
    expect(getQuery(links?.errorTracesUrl ?? '')).toContain('>> { status = error }');
  });

  test('passes links built from the platform path to the platform-bucket view', async () => {
    vi.mocked(getPlatformApplication).mockResolvedValue({
      success: true,
      etag: 'e',
      response: mergedPlatformApp('platform/ahQuickApp'),
    });

    const links = getLinks(await renderPage(undefined));

    expect(getQuery(links?.allTracesUrl ?? '')).toBe('{ span.dial.deployment =~ ".*platform/ahQuickApp" }');
  });

  test('passes null links when GRAFANA_TRACES_URL is not set', async () => {
    vi.stubEnv('GRAFANA_TRACES_URL', '');
    vi.mocked(getApp).mockResolvedValue({
      success: true,
      etag: 'e',
      response: mergedApp('public/ahQuickApp__1.0.0'),
    });

    expect(getLinks(await renderPage('public/ahQuickApp__1.0.0'))).toBeNull();
  });

  test('passes null links when the application has no Core path', async () => {
    vi.mocked(getPlatformApplication).mockResolvedValue({ success: true, etag: 'e', response: mergedPlatformApp() });

    expect(getLinks(await renderPage(undefined))).toBeNull();
  });
});

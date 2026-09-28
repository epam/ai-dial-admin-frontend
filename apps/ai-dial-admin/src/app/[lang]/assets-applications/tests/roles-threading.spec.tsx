import { beforeEach, describe, expect, test, vi } from 'vitest';

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

const { roles } = vi.hoisted(() => ({ roles: [{ name: 'admin' }] }));
vi.mock('@/src/server/catalog-schemas/read-options', () => ({
  readCatalogSchemaOptions: vi.fn().mockResolvedValue({ options: [] }),
}));
vi.mock('@/src/server/config-entities/read-page-options', () => ({
  readConfigEntities: vi.fn().mockResolvedValue(roles),
  readGlobalInterceptors: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/src/components/Assets/Apps/View', () => ({
  default: (props: Record<string, unknown>) => <div data-view="AppView" data-roles={JSON.stringify(props.roles)} />,
}));
vi.mock('@/src/components/Assets/Platform/Applications/View', () => ({
  default: (props: Record<string, unknown>) => (
    <div data-view="PlatformApplicationView" data-roles={JSON.stringify(props.roles)} />
  ),
}));

import { getApp, getPlatformApplication } from '@/src/app/[lang]/assets-applications/actions';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { DialPlatformApplicationResource } from '@/src/models/dial/resource';

// Both entity types require the whole Core payload; these cases care only about which view the page
// renders and what `roles` it threads, so the factories carry the rest.
const assetApp = (overrides: Partial<AssetApp> = {}): AssetApp => ({
  name: 'my-app',
  path: 'applications/public/my-app',
  folderId: 'public',
  version: '1.0',
  ...overrides,
});

const platformApp = (overrides: Partial<DialPlatformApplicationResource> = {}): DialPlatformApplicationResource => ({
  name: 'my-app',
  folderId: 'platform',
  // A merged platform-bucket read carries its identity under `_metadata` (the merge layer's graft),
  // never flat — see `DialPlatformApplicationResource`.
  _metadata: {
    name: 'my-app',
    path: 'platform/my-app',
    folderId: 'platform',
  },
  description_keywords: [],
  dependencies: [],
  interceptors: [],
  icon_url: '',
  reference: 'ref',
  max_retry_attempts: 0,
  forward_auth_token: false,
  input_attachment_types: [],
  application_properties: {},
  ...overrides,
});

type RenderedElement = { props: { children: { type: unknown; props: Record<string, unknown> } } };

const renderPage = async (path?: string) =>
  (await Page({
    params: Promise.resolve({ id: 'my-app' }),
    searchParams: Promise.resolve({ path }),
  })) as unknown as RenderedElement;

describe('assets-applications detail page — roles threading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getApp).mockResolvedValue({ success: true, etag: 'e', response: assetApp() });
    vi.mocked(getPlatformApplication).mockResolvedValue({ success: true, etag: 'e', response: platformApp() });
  });

  test('passes the fetched roles to the platform-bucket view', async () => {
    const page = await renderPage(undefined);
    const view = page.props.children;

    expect(view.props.roles).toEqual(roles);
  });

  test('does not pass roles to the public-bucket view — the read is unconditional, but the prop is platform-only', async () => {
    const page = await renderPage('public/folder/my-app');
    const view = page.props.children;

    expect(view.props.roles).toBeUndefined();
  });
});

import { beforeEach, describe, expect, test, vi } from 'vitest';

import Page from '@/src/app/[lang]/assets-toolsets/[id]/page';

vi.mock('next/headers', () => ({ headers: vi.fn(), cookies: vi.fn() }));
vi.mock('@/src/utils/auth/auth-request', () => ({ getUserToken: vi.fn().mockResolvedValue('token') }));
vi.mock('@/src/utils/env/get-auth-toggle', () => ({ getIsEnableAuthToggle: vi.fn().mockReturnValue(false) }));
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn() }));

vi.mock('@/src/app/[lang]/assets-toolsets/actions', () => ({
  getToolset: vi.fn(),
  getToolsets: vi.fn(),
  getPlatformToolset: vi.fn(),
}));

const { roles } = vi.hoisted(() => ({ roles: [{ name: 'admin' }] }));
vi.mock('@/src/server/config-entities/read-page-options', () => ({
  readConfigEntities: vi.fn().mockResolvedValue(roles),
}));

vi.mock('@/src/components/Assets/Toolsets/View/View', () => ({
  default: (props: Record<string, unknown>) => <div data-view="ToolsetView" data-roles={JSON.stringify(props.roles)} />,
}));
vi.mock('@/src/components/Assets/Platform/Toolsets/View', () => ({
  default: (props: Record<string, unknown>) => (
    <div data-view="PlatformToolsetView" data-roles={JSON.stringify(props.roles)} />
  ),
}));

import { getPlatformToolset, getToolset } from '@/src/app/[lang]/assets-toolsets/actions';
import { DialPlatformToolsetResource, DialToolsetResource } from '@/src/models/dial/resource';

// Both resource types require the whole Core payload; these cases care only about which view the page
// renders and what `roles` it threads, so the factories carry the rest.
const toolsetResource = (overrides: Partial<DialToolsetResource> = {}): DialToolsetResource => ({
  name: 'my-toolset',
  folderId: 'public',
  version: '1.0',
  // A merged detail read carries its identity under `_metadata` (the merge layer's graft), never flat.
  _metadata: {
    name: 'my-toolset',
    path: 'toolsets/public/my-toolset',
    folderId: 'public',
    version: '1.0',
  },
  description: '',
  description_keywords: [],
  dependencies: [],
  interceptors: [],
  icon_url: '',
  reference: 'ref',
  max_retry_attempts: 0,
  forward_auth_token: false,
  forward_per_request_key: false,
  allowed_tools: [],
  created_at: 0,
  updated_at: 0,
  updatedAt: '0',
  ...overrides,
});

const platformToolset = (overrides: Partial<DialPlatformToolsetResource> = {}): DialPlatformToolsetResource => ({
  name: 'my-toolset',
  folderId: 'platform',
  // A merged platform-bucket read carries its identity under `_metadata` (the merge layer's graft),
  // never flat — see `DialPlatformToolsetResource`.
  _metadata: {
    name: 'my-toolset',
    path: 'toolsets/platform/my-toolset',
    folderId: 'platform',
  },
  description: '',
  description_keywords: [],
  dependencies: [],
  interceptors: [],
  icon_url: '',
  reference: 'ref',
  max_retry_attempts: 0,
  forward_auth_token: false,
  forward_per_request_key: false,
  allowed_tools: [],
  // `DialPlatformToolsetResource` omits the snake_case `created_at`/`updated_at` the bucketed
  // resource carries; the platform bucket's write path serves camelCase `ModifiedEntity` spellings.
  ...overrides,
});

type RenderedElement = { props: { children: { type: unknown; props: Record<string, unknown> } } };

const renderPage = async (path?: string) =>
  (await Page({
    params: Promise.resolve({ id: 'my-toolset' }),
    searchParams: Promise.resolve({ path }),
  })) as unknown as RenderedElement;

describe('assets-toolsets detail page — roles threading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getToolset).mockResolvedValue({ success: true, etag: 'e', response: toolsetResource() });
    vi.mocked(getPlatformToolset).mockResolvedValue({ success: true, etag: 'e', response: platformToolset() });
  });

  test('passes the fetched roles to the platform-bucket view', async () => {
    const page = await renderPage(undefined);
    const view = page.props.children;

    expect(view.props.roles).toEqual(roles);
  });

  test('does not pass roles to the public-bucket view — the read is unconditional, but the prop is platform-only', async () => {
    const page = await renderPage('public/folder/my-toolset');
    const view = page.props.children;

    expect(view.props.roles).toBeUndefined();
  });
});

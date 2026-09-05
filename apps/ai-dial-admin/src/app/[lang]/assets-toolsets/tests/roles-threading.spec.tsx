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

type RenderedElement = { props: { children: { type: unknown; props: Record<string, unknown> } } };

const renderPage = async (path?: string) =>
  (await Page({
    params: Promise.resolve({ id: 'my-toolset' }),
    searchParams: Promise.resolve({ path }),
  })) as unknown as RenderedElement;

describe('assets-toolsets detail page — roles threading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getToolset).mockResolvedValue({ etag: 'e', response: { name: 'my-toolset', folderId: 'f' } });
    vi.mocked(getPlatformToolset).mockResolvedValue({ etag: 'e', response: { name: 'my-toolset' } });
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

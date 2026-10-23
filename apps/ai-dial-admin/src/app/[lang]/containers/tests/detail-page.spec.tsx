import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Page from '@/src/app/[lang]/containers/[id]/page';
import { ApplicationRoute } from '@/src/types/routes';
import { CONTAINER_SOURCE_TYPE, CONTAINER_STATUS, CONTAINER_TYPE } from '@/src/types/deployments/containers';

vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn() }));
vi.mock('@/src/utils/auth/auth-request', () => ({ getUserToken: vi.fn().mockResolvedValue('token') }));
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('@/src/app/actions/deployments', () => ({
  getContainer: vi.fn(),
  getContainers: vi.fn(),
  getImage: vi.fn(),
}));
vi.mock('@/src/app/api/api', () => ({
  adaptersApi: { getAdaptersList: vi.fn().mockResolvedValue([{ name: 'adapter-1' }]) },
  interceptorsApi: { getInterceptorsList: vi.fn().mockResolvedValue([]) },
  toolSetsApi: { getToolsetList: vi.fn().mockResolvedValue([]) },
}));
vi.mock('@/src/app/[lang]/adapters/actions', () => ({ createAdapter: vi.fn() }));
vi.mock('@/src/app/[lang]/applications/actions', () => ({ createApplication: vi.fn(), getApplications: vi.fn() }));
vi.mock('@/src/app/[lang]/interceptors/actions', () => ({ createInterceptor: vi.fn() }));
vi.mock('@/src/app/[lang]/toolsets/actions', () => ({ createToolset: vi.fn() }));
vi.mock('@/src/components/Containers/View/ContainerView', () => ({ default: () => null }));
vi.mock('@/src/app/actions/container-asset-names', () => ({
  getContainerAssetNames: vi.fn().mockResolvedValue(['core-model']),
}));

import { getContainerAssetNames } from '@/src/app/actions/container-asset-names';
import { getContainer, getContainers } from '@/src/app/actions/deployments';
import { createAdapter } from '@/src/app/[lang]/adapters/actions';
import { adaptersApi } from '@/src/app/api/api';
import { ToolsetFolderProvider } from '@/src/context/assets/ToolsetsFolderContext';

interface RenderedElement {
  props: Record<string, unknown> & { children: RenderedElement };
  type: unknown;
}

const renderPage = async () =>
  (await Page({
    params: Promise.resolve({ id: 'adapter-box' }),
    searchParams: Promise.resolve({ entityType: '' }),
  })) as unknown as RenderedElement;

// SaveValidationContextProvider > ContainerView: a flat-platform asset (adapter → model) needs no folder state.
const viewPropsOf = (rendered: RenderedElement) => rendered.props.children.props;

describe('Container detail page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getContainer).mockResolvedValue({
      success: true,
      response: {
        name: 'adapter-box',
        $type: CONTAINER_TYPE.ADAPTER,
        status: CONTAINER_STATUS.RUNNING,
        source: { $type: CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE },
        metadata: {},
      },
    } as never);
    vi.mocked(getContainers).mockResolvedValue({ success: true, response: [] } as never);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('makes no admin-backend call and offers no admin create without the admin API', async () => {
    vi.stubEnv('DIAL_ADMIN_API_URL', undefined);

    const rendered = await renderPage();

    expect(adaptersApi.getAdaptersList).not.toHaveBeenCalled();
    expect(viewPropsOf(rendered).createEntity).toBeUndefined();
    expect(viewPropsOf(rendered).entityNames).toEqual([]);
  });

  test('fetches the admin-backend names and passes the admin create with the admin API', async () => {
    vi.stubEnv('DIAL_ADMIN_API_URL', 'http://admin');

    const rendered = await renderPage();

    expect(adaptersApi.getAdaptersList).toHaveBeenCalledOnce();
    expect(viewPropsOf(rendered).createEntity).toBe(createAdapter);
    expect(viewPropsOf(rendered).entityNames).toEqual(['adapter-1']);
  });

  test('renders an adapter container without a folder provider, as its model create is flat', async () => {
    vi.stubEnv('DIAL_ADMIN_API_URL', undefined);

    const rendered = await renderPage();

    expect(rendered.props.children.type).not.toBe(ToolsetFolderProvider);
    expect(viewPropsOf(rendered).route).toBe(ApplicationRoute.AdapterContainers);
  });

  test('wraps an MCP container in a fresh toolset folder state for the asset modal', async () => {
    vi.stubEnv('DIAL_ADMIN_API_URL', undefined);
    vi.mocked(getContainer).mockResolvedValueOnce({
      success: true,
      response: {
        name: 'mcp-box',
        $type: CONTAINER_TYPE.MCP,
        status: CONTAINER_STATUS.RUNNING,
        source: { $type: CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE },
        metadata: {},
      },
    } as never);

    const rendered = await renderPage();

    expect(rendered.props.children.type).toBe(ToolsetFolderProvider);
  });

  test('still passes the Core names when an admin-backend read fails', async () => {
    vi.stubEnv('DIAL_ADMIN_API_URL', 'http://admin');
    vi.mocked(adaptersApi.getAdaptersList).mockRejectedValueOnce(new Error('admin down'));

    expect(viewPropsOf(await renderPage()).assetNames).toEqual(['core-model']);
  });

  test('passes the Core model names for the asset create in either mode', async () => {
    vi.stubEnv('DIAL_ADMIN_API_URL', undefined);

    const rendered = await renderPage();

    expect(getContainerAssetNames).toHaveBeenCalledWith(ApplicationRoute.PlatformModels);
    expect(viewPropsOf(rendered).assetNames).toEqual(['core-model']);
  });
});

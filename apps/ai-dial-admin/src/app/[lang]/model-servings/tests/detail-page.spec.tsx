import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Page from '@/src/app/[lang]/model-servings/[id]/page';
import { ApplicationRoute } from '@/src/types/routes';
import { CONTAINER_SOURCE_TYPE, CONTAINER_STATUS, CONTAINER_TYPE } from '@/src/types/deployments/containers';

vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn() }));
vi.mock('@/src/utils/auth/auth-request', () => ({ getUserToken: vi.fn().mockResolvedValue('token') }));
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('@/src/app/actions/deployments', () => ({ getContainer: vi.fn(), getModelContainers: vi.fn() }));
vi.mock('@/src/app/api/api', () => ({
  toolSetsApi: { getToolsetList: vi.fn().mockResolvedValue([{ name: 'toolset-1' }]) },
}));
vi.mock('@/src/app/[lang]/models/actions', () => ({
  createModel: vi.fn(),
  getModelsList: vi.fn().mockResolvedValue([{ name: 'model-1' }]),
}));
vi.mock('@/src/app/[lang]/toolsets/actions', () => ({ createToolset: vi.fn() }));
vi.mock('@/src/components/Containers/View/ContainerView', () => ({ default: () => null }));
vi.mock('@/src/app/actions/container-asset-names', () => ({
  getContainerAssetNames: vi.fn().mockResolvedValue(['core-model']),
}));

import { getContainerAssetNames } from '@/src/app/actions/container-asset-names';
import { getContainer, getModelContainers } from '@/src/app/actions/deployments';
import { createModel, getModelsList } from '@/src/app/[lang]/models/actions';
import { createToolset } from '@/src/app/[lang]/toolsets/actions';
import { toolSetsApi } from '@/src/app/api/api';

interface RenderedElement {
  props: Record<string, unknown> & { children: RenderedElement };
}

const renderPage = async () =>
  (await Page({
    params: Promise.resolve({ id: 'serving-1' }),
    searchParams: Promise.resolve({ entityType: '' }),
  })) as unknown as RenderedElement;

// SaveValidationContextProvider > ToolsetFolderProvider > ContainerView
const viewPropsOf = (rendered: RenderedElement) => rendered.props.children.props.children.props;

describe('Model Serving detail page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getContainer).mockResolvedValue({
      success: true,
      response: {
        name: 'serving-1',
        $type: CONTAINER_TYPE.HF,
        status: CONTAINER_STATUS.RUNNING,
        source: { $type: CONTAINER_SOURCE_TYPE.HUGGINGFACE },
        metadata: {},
      },
    } as never);
    vi.mocked(getModelContainers).mockResolvedValue({ success: true, response: [] } as never);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('makes no admin-backend call and offers no admin create without the admin API', async () => {
    vi.stubEnv('DIAL_ADMIN_API_URL', undefined);

    const props = viewPropsOf(await renderPage());

    expect(getModelsList).not.toHaveBeenCalled();
    expect(toolSetsApi.getToolsetList).not.toHaveBeenCalled();
    expect(props.createEntity).toBeUndefined();
    expect(props.createToolset).toBeUndefined();
  });

  test('fetches the admin-backend names and passes both admin creates with the admin API', async () => {
    vi.stubEnv('DIAL_ADMIN_API_URL', 'http://admin');

    const props = viewPropsOf(await renderPage());

    expect(props.createEntity).toBe(createModel);
    expect(props.createToolset).toBe(createToolset);
    expect(props.entityNames).toEqual(['model-1']);
    expect(props.toolsetNames).toEqual(['toolset-1']);
  });

  test('passes the Core model names for the asset create in either mode', async () => {
    vi.stubEnv('DIAL_ADMIN_API_URL', undefined);

    const rendered = await renderPage();

    expect(getContainerAssetNames).toHaveBeenCalledWith(ApplicationRoute.PlatformModels);
    expect(viewPropsOf(rendered).assetNames).toEqual(['core-model']);
  });

  test('still passes the Core names when an admin-backend read fails', async () => {
    vi.stubEnv('DIAL_ADMIN_API_URL', 'http://admin');
    vi.mocked(getModelsList).mockRejectedValueOnce(new Error('admin down'));

    expect(viewPropsOf(await renderPage()).assetNames).toEqual(['core-model']);
  });
});

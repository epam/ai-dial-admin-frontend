import { beforeEach, describe, expect, test, vi } from 'vitest';

import Page from '@/src/app/[lang]/platform-catalog-schemas/[id]/page';

vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn() }));
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('@/src/app/[lang]/platform-catalog-schemas/actions', () => ({
  getCatalogSchema: vi.fn(),
  getConfigFileCatalogSchema: vi.fn(),
}));

vi.mock('@/src/components/Assets/Platform/CatalogSchemas/View', () => ({
  default: (props: Record<string, unknown>) => (
    <div data-view="CatalogSchemaView" data-config-file={String(props.isConfigFileSource)} />
  ),
}));

import { getCatalogSchema, getConfigFileCatalogSchema } from '@/src/app/[lang]/platform-catalog-schemas/actions';

type RenderedElement = { props: { children: { props: Record<string, unknown> } } };

const SCHEMA_ID = 'https://dial.epam.com/catalog-schemas/agent';
const SEGMENT = encodeURIComponent(SCHEMA_ID);

const renderPage = async (configFile?: string) =>
  (await Page({
    params: Promise.resolve({ id: SEGMENT }),
    searchParams: Promise.resolve({ configFile }),
  })) as unknown as RenderedElement;

describe('Catalog schema detail page :: resolving either population', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('reads the API-written half first, under the route segment as Core stores it', async () => {
    vi.mocked(getCatalogSchema).mockResolvedValue({
      success: true,
      response: { $id: SCHEMA_ID, name: SCHEMA_ID, path: `catalog/${SCHEMA_ID}`, folderId: 'catalog' },
      etag: 'etag-1',
    });

    const rendered = await renderPage();

    expect(getCatalogSchema).toHaveBeenCalledWith(SEGMENT, expect.any(String));
    expect(getConfigFileCatalogSchema).not.toHaveBeenCalled();
    expect(rendered.props.children.props.isConfigFileSource).toBe(false);
  });

  test('falls back to the config-file half, which is keyed by the decoded $id', async () => {
    vi.mocked(getCatalogSchema).mockResolvedValue({ success: false, errorMessage: 'Not found' });
    vi.mocked(getConfigFileCatalogSchema).mockResolvedValue({ success: true, data: { $id: SCHEMA_ID } } as never);

    const rendered = await renderPage();

    expect(getConfigFileCatalogSchema).toHaveBeenCalledWith(SCHEMA_ID);
    expect(rendered.props.children.props.isConfigFileSource).toBe(true);
  });

  test('marks a fallback-resolved schema read-only, so a file entry offers no save', async () => {
    vi.mocked(getCatalogSchema).mockResolvedValue({ success: false });
    vi.mocked(getConfigFileCatalogSchema).mockResolvedValue({ success: true, data: { $id: SCHEMA_ID } } as never);

    const rendered = await renderPage();

    expect(rendered.props.children.props.isConfigFileSource).toBe(true);
  });

  test('reports a schema in neither population as not found', async () => {
    vi.mocked(getCatalogSchema).mockResolvedValue({ success: false });
    vi.mocked(getConfigFileCatalogSchema).mockResolvedValue({ success: false, failure: {} } as never);

    await expect(renderPage()).rejects.toThrow('NEXT_NOT_FOUND');
  });

  test('reads only the config-file half on the explicit config-file route', async () => {
    vi.mocked(getConfigFileCatalogSchema).mockResolvedValue({ success: true, data: { $id: SCHEMA_ID } } as never);

    const rendered = await renderPage('true');

    expect(getCatalogSchema).not.toHaveBeenCalled();
    expect(getConfigFileCatalogSchema).toHaveBeenCalledWith(SCHEMA_ID);
    expect(rendered.props.children.props.isConfigFileSource).toBe(true);
  });
});

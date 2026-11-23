import { notFound } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import Page from '@/src/app/[lang]/publications/[id]/page';
import { publicationsApi } from '@/src/app/api/api';
import PublicationView from '@/src/components/Publications/View/View';
import { Publication } from '@/src/models/dial/publications';
import { ResourceType } from '@/src/types/resource-type';

vi.mock('@/src/app/api/api', () => ({
  publicationsApi: { getPublication: vi.fn() },
  applicationRunnersApi: {},
}));
vi.mock('@/src/app/[lang]/platform-app-runners/actions');
vi.mock('@/src/components/Publications/View/View', () => ({ default: vi.fn() }));
vi.mock('@/src/components/Publications/View/ComplexResourceView', () => ({ default: vi.fn() }));
vi.mock('@/src/utils/auth/auth-request', () => ({ getUserToken: vi.fn() }));
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn(), errorLog: vi.fn() }));

const CORE_ISSUED_PATH = 'public/My%20Folder/req%2520__1';

const renderPage = (path = CORE_ISSUED_PATH) =>
  Page({ searchParams: Promise.resolve({ path, type: ResourceType.PROMPT }) });

describe('publication view page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('loads the publication by the Core-issued path from the query', async () => {
    const data = { path: CORE_ISSUED_PATH } as Publication;
    vi.mocked(publicationsApi.getPublication).mockResolvedValue(data);

    const page = (await renderPage()) as { props: { children: { type: unknown; props: Record<string, unknown> } } };

    expect(publicationsApi.getPublication).toHaveBeenCalledWith(undefined, CORE_ISSUED_PATH);
    expect(page.props.children.type).toBe(PublicationView);
    expect(page.props.children.props).toMatchObject({ publication: data });
  });

  test.each([
    ['a 403', undefined],
    ['another failure', null],
  ])('renders not found when the publication resolves to nothing after %s', async (_, result) => {
    vi.mocked(publicationsApi.getPublication).mockResolvedValue(result);

    await expect(renderPage()).rejects.toThrow();

    expect(notFound).toHaveBeenCalledOnce();
  });
});

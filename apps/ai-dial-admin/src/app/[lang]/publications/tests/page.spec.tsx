import { notFound } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import Page from '@/src/app/[lang]/publications/page';
import { publicationsApi } from '@/src/app/api/api';
import PublicationsList from '@/src/components/Publications/List/List';
import { Publication } from '@/src/models/dial/publications';

vi.mock('@/src/app/api/api', () => ({ publicationsApi: { getPublicationList: vi.fn() } }));
vi.mock('@/src/utils/auth/auth-request', () => ({ getUserToken: vi.fn() }));
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn(), errorLog: vi.fn() }));

const rendered = (element: unknown) => element as { type: unknown; props: Record<string, unknown> };

describe('publications list page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('passes the publications to the list', async () => {
    const data = [{ path: 'public/p1' }] as Publication[];
    vi.mocked(publicationsApi.getPublicationList).mockResolvedValue(data);

    const page = rendered(await Page());

    expect(page.type).toBe(PublicationsList);
    expect(page.props).toMatchObject({ data });
  });

  test.each([
    ['a 403', undefined],
    ['another failure', null],
  ])('renders not found when the list resolves to nothing after %s', async (_, result) => {
    vi.mocked(publicationsApi.getPublicationList).mockResolvedValue(result);

    await expect(Page()).rejects.toThrow();

    expect(notFound).toHaveBeenCalledOnce();
  });
});

import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getEntities, listSavedQueries } from '@/src/app/[lang]/queries/actions';
import Layout from '@/src/app/[lang]/queries/layout';
import { getTables } from '@/src/app/[lang]/tables/actions';
import { SourcePanelProvider } from '@/src/components/Analytics/QueryBuilder/SourcePanel/context';
import { SavedQuery, SavedQueryScope } from '@/src/models/analytics/saved-query';
import { AnalyticsTableType } from '@/src/models/analytics/table';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';

vi.mock('@/src/app/[lang]/queries/actions');
vi.mock('@/src/app/[lang]/tables/actions');
vi.mock('@/src/server/analytics/analytics-access');
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn(), errorLog: vi.fn() }));

type RenderedElement = { type: unknown; props: Record<string, unknown> };

const savedQuery = (id: string, scope: SavedQueryScope): SavedQuery => ({
  id,
  name: id,
  scope,
  generation: 1,
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-01T00:00:00Z',
});

const PERSONAL = savedQuery('mine', SavedQueryScope.Personal);
const COMMON = savedQuery('shared', SavedQueryScope.Common);

const renderLayout = async () => (await Layout({ children: 'page' })) as RenderedElement;

describe('queries layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isAnalyticsForbidden).mockResolvedValue(false);
    vi.mocked(getEntities).mockResolvedValue({ success: true, response: [{ name: 'conversation' }] });
    vi.mocked(getTables).mockResolvedValue({
      success: true,
      response: [{ name: 'conversation', type: AnalyticsTableType.Source, description: 'One row per conversation' }],
    });
    vi.mocked(listSavedQueries).mockImplementation(async (scope) =>
      scope === SavedQueryScope.Personal ? [PERSONAL] : [COMMON],
    );
  });

  test('hands the provider the queryable tables and both scopes of saved queries', async () => {
    const layout = await renderLayout();

    expect(layout.type).toBe(SourcePanelProvider);
    expect(layout.props.children).toBe('page');
    expect(layout.props.tables).toEqual([
      { name: 'conversation', description: 'One row per conversation', tagOrder: void 0 },
    ]);
    expect(layout.props.queries).toEqual([PERSONAL, COMMON]);
    expect(layout.props.tablesFailure).toBeNull();
    expect(layout.props.queriesFailure).toBeNull();
  });

  test('hands over the service failure when the table read fails', async () => {
    vi.mocked(getEntities).mockResolvedValue({
      success: false,
      errorHeader: 'Service unavailable',
      errorMessage: 'upstream timeout',
      requestId: 'trace-1',
    });

    const layout = await renderLayout();

    expect(layout.props.tables).toEqual([]);
    expect(layout.props.tablesFailure).toEqual({
      errorHeader: 'Service unavailable',
      errorMessage: 'upstream timeout',
      requestId: 'trace-1',
    });
  });

  test('reports a table read that threw as a failure with no service details', async () => {
    vi.mocked(getEntities).mockRejectedValue(new Error('network down'));

    const layout = await renderLayout();

    expect(layout.props.tables).toEqual([]);
    expect(layout.props.tablesFailure).toEqual({});
    expect(layout.props.queries).toEqual([PERSONAL, COMMON]);
  });

  test('reads nothing when Analytics access is denied', async () => {
    vi.mocked(isAnalyticsForbidden).mockResolvedValue(true);

    const layout = await renderLayout();

    expect(layout.props.tables).toEqual([]);
    expect(layout.props.queries).toEqual([]);
    expect(getEntities).not.toHaveBeenCalled();
    expect(listSavedQueries).not.toHaveBeenCalled();
    expect(layout.props.tablesFailure).toBeNull();
    expect(layout.props.queriesFailure).toBeNull();
  });

  test('lists the tables without descriptions when the catalog read fails', async () => {
    vi.mocked(getTables).mockRejectedValue(new Error('catalog down'));

    const layout = await renderLayout();

    expect(layout.props.tables).toEqual([{ name: 'conversation', description: void 0, tagOrder: void 0 }]);
    expect(layout.props.queries).toEqual([PERSONAL, COMMON]);
  });

  test('keeps the scope that was read when the other one fails', async () => {
    vi.mocked(listSavedQueries).mockImplementation(async (scope) => {
      if (scope === SavedQueryScope.Common) throw new Error('scope down');
      return [PERSONAL];
    });

    const layout = await renderLayout();

    expect(layout.props.queries).toEqual([PERSONAL]);
    expect(layout.props.queriesFailure).toEqual({});
  });
});

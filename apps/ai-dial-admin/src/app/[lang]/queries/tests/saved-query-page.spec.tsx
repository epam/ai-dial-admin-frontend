import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  getEntities,
  getEntitySchema,
  getFunctions,
  getSavedQuery,
  translateQuery,
} from '@/src/app/[lang]/queries/actions';
import Page from '@/src/app/[lang]/queries/[id]/page';
import QueryBuilder from '@/src/components/Analytics/QueryBuilder/QueryBuilder';
import QueryPageShell from '@/src/components/Analytics/QueryBuilder/SourcePanel/QueryPageShell';
import Page403 from '@/src/components/Page403/Page403';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryMode, QueryPageType, StructuredQuery } from '@/src/models/analytics/query';
import { SavedQuery, SavedQueryScope, SavedQueryTimeMode } from '@/src/models/analytics/saved-query';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';

vi.mock('@/src/app/[lang]/queries/actions');
vi.mock('@/src/server/analytics/analytics-access');
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn(), errorLog: vi.fn() }));

type RenderedElement = { type: unknown; key: string | null; props: Record<string, unknown> };

const FIELDS: AnalyticsEntityField[] = [{ name: 'chat_id', type: AnalyticsFieldType.String, source: 'chat_id' }];

const CHIP_BODY: StructuredQuery = {
  entity: 'conversation',
  mode: QueryMode.Row,
  page: { type: QueryPageType.Offset, limit: 25, offset: 0, include_total: false },
};

const DISTINCT_BODY: StructuredQuery = { ...CHIP_BODY, distinct: true };

const saved = (overrides?: Partial<SavedQuery>): SavedQuery => ({
  id: 'sq_1',
  name: 'Top chats',
  scope: SavedQueryScope.Personal,
  generation: 1,
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-02T00:00:00Z',
  ...overrides,
});

const renderPage = async () => (await Page({ params: Promise.resolve({ id: 'sq_1' }) })) as RenderedElement;

const renderBuilder = async () => {
  const shell = (await renderPage()).props.children as RenderedElement;
  expect(shell.type).toBe(QueryPageShell);
  return shell.props.children as RenderedElement;
};

describe('saved query page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isAnalyticsForbidden).mockResolvedValue(false);
    vi.mocked(getEntities).mockResolvedValue({ success: true, response: [{ name: 'conversation' }] });
    vi.mocked(getFunctions).mockResolvedValue([]);
    vi.mocked(getEntitySchema).mockResolvedValue({ success: true, response: { fields: FIELDS } });
    vi.mocked(getSavedQuery).mockResolvedValue(saved({ query: CHIP_BODY }));
    vi.mocked(translateQuery).mockResolvedValue({ success: true, response: { sql: 'SELECT DISTINCT *' } });
  });

  test('resolves to the 403 page without reading anything when access is denied', async () => {
    vi.mocked(isAnalyticsForbidden).mockResolvedValue(true);

    const page = await renderPage();

    expect(page.type).toBe(Page403);
    expect(getSavedQuery).not.toHaveBeenCalled();
  });

  test('passes a body the chips can state to the builder without translating it', async () => {
    const builder = await renderBuilder();

    expect(builder.type).toBe(QueryBuilder);
    expect(builder.key).toBe('sq_1');
    expect(builder.props.initialEntityName).toBe('conversation');
    expect(builder.props.initialFields).toEqual(FIELDS);
    expect(builder.props.translatedSql).toBeNull();
    expect(builder.props.translationFailure).toBeNull();
    expect(translateQuery).not.toHaveBeenCalled();
  });

  test('translates a body the chips cannot state and passes the SQL', async () => {
    vi.mocked(getSavedQuery).mockResolvedValue(saved({ query: DISTINCT_BODY }));

    const builder = await renderBuilder();

    expect(translateQuery).toHaveBeenCalledExactlyOnceWith(DISTINCT_BODY);
    expect(builder.props.translatedSql).toBe('SELECT DISTINCT *');
    expect(builder.props.translationFailure).toBeNull();
  });

  test('translates the body bounded by the stored period', async () => {
    vi.mocked(getEntitySchema).mockResolvedValue({
      success: true,
      response: {
        fields: [{ name: 'request_time', type: AnalyticsFieldType.Timestamp, source: 'request_time' }],
      },
    });
    vi.mocked(getSavedQuery).mockResolvedValue(
      saved({ query: DISTINCT_BODY, time: { mode: SavedQueryTimeMode.Relative, period: '7d' } }),
    );

    await renderBuilder();

    const [translated] = vi.mocked(translateQuery).mock.lastCall ?? [];
    expect(translated?.distinct).toBe(true);
    expect(JSON.stringify(translated?.filter)).toContain('request_time');
  });

  test('passes the failure when the translation is refused', async () => {
    vi.mocked(getSavedQuery).mockResolvedValue(saved({ query: DISTINCT_BODY }));
    vi.mocked(translateQuery).mockResolvedValue({
      success: false,
      status: 400,
      errorHeader: 'Bad request',
      errorMessage: 'not expressible',
      requestId: 'req-1',
    });

    const builder = await renderBuilder();

    expect(builder.props.translatedSql).toBeNull();
    expect(builder.props.translationFailure).toEqual({
      errorHeader: 'Bad request',
      errorMessage: 'not expressible',
      requestId: 'req-1',
    });
  });

  test('passes an empty failure when the translation throws', async () => {
    vi.mocked(getSavedQuery).mockResolvedValue(saved({ query: DISTINCT_BODY }));
    vi.mocked(translateQuery).mockRejectedValue(new Error('network down'));

    const builder = await renderBuilder();

    expect(builder.type).toBe(QueryBuilder);
    expect(builder.props.translatedSql).toBeNull();
    expect(builder.props.translationFailure).toEqual({});
  });

  test('does not translate a query stored as SQL', async () => {
    vi.mocked(getSavedQuery).mockResolvedValue(saved({ sql: 'SELECT 1', source: ['conversation'] }));

    const builder = await renderBuilder();

    expect(translateQuery).not.toHaveBeenCalled();
    expect(builder.props.translatedSql).toBeNull();
  });
});

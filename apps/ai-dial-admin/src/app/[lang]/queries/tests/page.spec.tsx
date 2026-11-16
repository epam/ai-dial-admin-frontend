import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getEntities, getEntitySchema, getFunctions } from '@/src/app/[lang]/queries/actions';
import Page from '@/src/app/[lang]/queries/page';
import QueryBuilderDraft from '@/src/components/Analytics/QueryBuilder/QueryBuilderDraft';
import QueryPageShell from '@/src/components/Analytics/QueryBuilder/SourcePanel/QueryPageShell';
import Page403 from '@/src/components/Page403/Page403';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';

vi.mock('@/src/app/[lang]/queries/actions');
vi.mock('@/src/server/analytics/analytics-access');
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn(), errorLog: vi.fn() }));

type RenderedElement = { type: unknown; key: string | null; props: Record<string, unknown> };

const FIELDS: AnalyticsEntityField[] = [{ name: 'chat_id', type: AnalyticsFieldType.String, source: 'chat_id' }];

const renderPage = async (table?: string) =>
  (await Page({ searchParams: Promise.resolve({ table }) })) as RenderedElement;

const renderShell = async (table?: string) => (await renderPage(table)).props.children as RenderedElement;

const renderBuilder = async (table?: string) => (await renderShell(table)).props.children as RenderedElement;

describe('draft query page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isAnalyticsForbidden).mockResolvedValue(false);
    vi.mocked(getEntities).mockResolvedValue({
      success: true,
      response: [{ name: 'conversation' }, { name: 'dial_usage_log' }],
    });
    vi.mocked(getFunctions).mockResolvedValue([]);
    vi.mocked(getEntitySchema).mockResolvedValue({ success: true, response: { fields: FIELDS } });
  });

  test('resolves to the 403 page without reading anything when access is denied', async () => {
    vi.mocked(isAnalyticsForbidden).mockResolvedValue(true);

    const page = await renderPage();

    expect(page.type).toBe(Page403);
    expect(getEntities).not.toHaveBeenCalled();
  });

  test('builds the draft on the first table when no table is named', async () => {
    const shell = await renderShell();
    const builder = shell.props.children as RenderedElement;

    expect(shell.type).toBe(QueryPageShell);
    expect(shell.props.currentTable).toBe('conversation');
    expect(builder.type).toBe(QueryBuilderDraft);
    expect(builder.props.initialEntityName).toBe('conversation');
    expect(builder.props.name).toBe('conversation');
    expect(getEntitySchema).toHaveBeenCalledExactlyOnceWith('conversation');
  });

  test('builds the draft on the named table with its schema', async () => {
    const builder = await renderBuilder('dial_usage_log');

    expect(builder.props.initialEntityName).toBe('dial_usage_log');
    expect(builder.props.initialFields).toEqual(FIELDS);
    expect(builder.key).toBe('draft:dial_usage_log');
    expect(getEntitySchema).toHaveBeenCalledExactlyOnceWith('dial_usage_log');
  });

  test('falls back to the first table when the named one is not queryable', async () => {
    const builder = await renderBuilder('gone');

    expect(builder.props.initialEntityName).toBe('conversation');
  });

  test('requests no schema and passes no entities when none are queryable', async () => {
    vi.mocked(getEntities).mockResolvedValue({ success: true, response: [] });

    const builder = await renderBuilder();

    expect(builder.props.initialEntities).toEqual([]);
    expect(builder.props.initialFields).toEqual([]);
    expect(getEntitySchema).not.toHaveBeenCalled();
  });

  test('still renders the builder when the reads throw', async () => {
    vi.mocked(getEntities).mockRejectedValue(new Error('network down'));

    const builder = await renderBuilder();

    expect(builder.props.initialEntities).toEqual([]);
  });
});

import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getEntities, getEntitySchema, getFunctions } from '@/src/app/[lang]/queries/actions';
import Page from '@/src/app/[lang]/queries/page';
import QueryBuilderDraftPage from '@/src/components/Analytics/QueryBuilder/QueryBuilderDraftPage';
import Page403 from '@/src/components/Page403/Page403';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';

vi.mock('@/src/app/[lang]/queries/actions');
vi.mock('@/src/server/analytics/analytics-access');
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn(), errorLog: vi.fn() }));

type RenderedElement = { type: unknown; key: string | null; props: Record<string, unknown> };

const FIELDS: AnalyticsEntityField[] = [{ name: 'chat_id', type: AnalyticsFieldType.String, source: 'chat_id' }];

const renderPage = async () => (await Page()) as RenderedElement;

const renderDraft = async () => (await renderPage()).props.children as RenderedElement;

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

  test('starts the draft on the first table with its schema', async () => {
    const draft = await renderDraft();

    expect(draft.type).toBe(QueryBuilderDraftPage);
    expect(draft.props.initialEntityName).toBe('conversation');
    expect(draft.props.initialFields).toEqual(FIELDS);
    expect(draft.props.initialEntities).toEqual([{ name: 'conversation' }, { name: 'dial_usage_log' }]);
    expect(getEntitySchema).toHaveBeenCalledExactlyOnceWith('conversation');
  });

  test('requests no schema and passes no entities when none are queryable', async () => {
    vi.mocked(getEntities).mockResolvedValue({ success: true, response: [] });

    const draft = await renderDraft();

    expect(draft.props.initialEntities).toEqual([]);
    expect(draft.props.initialEntityName).toBe('');
    expect(draft.props.initialFields).toEqual([]);
    expect(getEntitySchema).not.toHaveBeenCalled();
  });

  test('still renders the draft when the reads throw', async () => {
    vi.mocked(getEntities).mockRejectedValue(new Error('network down'));

    const draft = await renderDraft();

    expect(draft.props.initialEntities).toEqual([]);
  });
});

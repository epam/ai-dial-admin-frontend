import { beforeEach, describe, expect, test, vi } from 'vitest';

import Page from '@/src/app/[lang]/conversations-trace/page';
import * as actions from '@/src/app/[lang]/conversations-trace/actions';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';

vi.mock('@/src/app/[lang]/conversations-trace/actions');
vi.mock('@/src/server/analytics/analytics-access');
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn(), errorLog: vi.fn() }));

const forbidden = () => isAnalyticsForbidden as unknown as ReturnType<typeof vi.fn>;
const schema = () => actions.getConversationsSchema as unknown as ReturnType<typeof vi.fn>;

const SCHEMA_FIELDS = [{ name: 'success_count', type: 'integer', source: 'success_count' }];

const renderPage = async () => (await Page()) as { type: unknown; props: Record<string, unknown> };

beforeEach(() => {
  vi.clearAllMocks();
  forbidden().mockResolvedValue(false);
  schema().mockResolvedValue({ success: true, response: { fields: SCHEMA_FIELDS } });
});

describe('conversations-trace page', () => {
  test('prefetches the entity schema and hands it to the view', async () => {
    const page = await renderPage();

    expect(schema()).toHaveBeenCalledOnce();
    expect(page.props).toMatchObject({ schemaFields: SCHEMA_FIELDS, hasSchemaError: false });
  });

  // The summary has to be an observation of the same fetch cycle as the rows on screen, so one resolved
  // during server rendering would be superseded the moment the client's first page lands — at the cost of
  // a scan of the whole filtered result.
  test('resolves no result summary while rendering on the server', async () => {
    await renderPage();

    expect(actions.getConversations).not.toHaveBeenCalled();
  });

  test('passes no prefetched figures to the view', async () => {
    const page = await renderPage();

    expect(page.props).not.toHaveProperty('initialTotals');
    expect(page.props).not.toHaveProperty('hasInitialLoadError');
  });

  test('reports a failed schema fetch so the view can say the columns are unavailable', async () => {
    schema().mockResolvedValue({ success: false });

    const page = await renderPage();

    expect(page.props).toMatchObject({ schemaFields: null, hasSchemaError: true });
  });

  test('reports a thrown schema fetch the same way', async () => {
    schema().mockRejectedValue(new Error('boom'));

    const page = await renderPage();

    expect(page.props).toMatchObject({ schemaFields: null, hasSchemaError: true });
  });

  test('renders Page403 and issues no query for a forbidden caller', async () => {
    forbidden().mockResolvedValue(true);

    await renderPage();

    expect(schema()).not.toHaveBeenCalled();
    expect(actions.getConversations).not.toHaveBeenCalled();
  });
});

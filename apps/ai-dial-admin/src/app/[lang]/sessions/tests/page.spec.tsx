import { beforeEach, describe, expect, test, vi } from 'vitest';

import Page from '@/src/app/[lang]/sessions/page';
import * as actions from '@/src/app/[lang]/sessions/actions';
import SessionsSourceError from '@/src/components/Analytics/SessionsTrace/SessionsSourceError';
import SessionsTraceView from '@/src/components/Analytics/SessionsTrace/SessionsTraceView';
import { SessionsRole, SessionsSourceProblem } from '@/src/models/analytics/sessions-source';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { defaultSessionsSource } from '@/src/utils/analytics/sessions-source';

vi.mock('@/src/app/[lang]/sessions/actions');
vi.mock('@/src/server/analytics/analytics-access');
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn(), errorLog: vi.fn() }));

const forbidden = () => isAnalyticsForbidden as unknown as ReturnType<typeof vi.fn>;
const schema = () => actions.getSessionsSchema as unknown as ReturnType<typeof vi.fn>;
const sessionsSource = () => actions.getSessionsSource as unknown as ReturnType<typeof vi.fn>;

const CUSTOM_SOURCE = { ...defaultSessionsSource(), baseTable: 'agent_runs', sessionId: 'run_key' };

const SCHEMA_FIELDS = [{ name: 'success_count', type: 'integer', source: 'success_count' }];

const renderPage = async () => (await Page()) as { type: unknown; props: Record<string, unknown> };

beforeEach(() => {
  vi.clearAllMocks();
  forbidden().mockResolvedValue(false);
  schema().mockResolvedValue({ success: true, response: { fields: SCHEMA_FIELDS } });
  sessionsSource().mockResolvedValue({ source: CUSTOM_SOURCE, failure: null });
});

describe('sessions-trace page', () => {
  test('prefetches the entity schema and hands it to the view', async () => {
    const page = await renderPage();

    expect(schema()).toHaveBeenCalledOnce();
    expect(page.type).toBe(SessionsTraceView);
    expect(page.props).toMatchObject({ schemaFields: SCHEMA_FIELDS, schemaFailure: null });
  });

  test('resolves the caller source and hands it to the view', async () => {
    const page = await renderPage();

    expect(sessionsSource()).toHaveBeenCalledOnce();
    expect(page.props.source).toEqual(CUSTOM_SOURCE);
  });

  test('renders the source error naming the role and field when a required role does not resolve', async () => {
    const failure = { role: SessionsRole.Time, field: 'ended_at' };
    sessionsSource().mockResolvedValue({ source: null, failure });

    const page = await renderPage();

    expect(page.type).toBe(SessionsSourceError);
    expect(page.props).toEqual({ failure });
  });

  test('renders the source error rather than the default source when the setting cannot be read', async () => {
    sessionsSource().mockResolvedValue({
      source: null,
      failure: null,
      problem: SessionsSourceProblem.SettingUnreadable,
    });

    const page = await renderPage();

    expect(page.type).toBe(SessionsSourceError);
    expect(page.props).toEqual({ failure: null, problem: SessionsSourceProblem.SettingUnreadable });
  });

  test('falls back to the default source when resolving the source throws', async () => {
    sessionsSource().mockRejectedValue(new Error('boom'));

    const page = await renderPage();

    expect(page.type).toBe(SessionsTraceView);
    expect(page.props.source).toEqual(defaultSessionsSource());
  });

  // The summary has to be an observation of the same fetch cycle as the rows on screen, so one resolved
  // during server rendering would be superseded the moment the client's first page lands — at the cost of
  // a scan of the whole filtered result.
  test('resolves no result summary while rendering on the server', async () => {
    await renderPage();

    expect(actions.getSessions).not.toHaveBeenCalled();
  });

  test('passes no prefetched figures to the view', async () => {
    const page = await renderPage();

    expect(page.props).not.toHaveProperty('initialTotals');
    expect(page.props).not.toHaveProperty('hasInitialLoadError');
  });

  test('reports a failed schema fetch so the view can say the columns are unavailable', async () => {
    schema().mockResolvedValue({ success: false });

    const page = await renderPage();

    expect(page.props).toMatchObject({
      schemaFields: null,
      schemaFailure: { errorMessage: void 0, errorHeader: void 0, requestId: void 0 },
    });
  });

  test('reports a thrown schema fetch the same way', async () => {
    schema().mockRejectedValue(new Error('boom'));

    const page = await renderPage();

    expect(page.props).toMatchObject({
      schemaFields: null,
      schemaFailure: { errorMessage: void 0, errorHeader: void 0, requestId: void 0 },
    });
  });

  test('renders Page403 and issues no query for a forbidden caller', async () => {
    forbidden().mockResolvedValue(true);

    await renderPage();

    expect(schema()).not.toHaveBeenCalled();
    expect(sessionsSource()).not.toHaveBeenCalled();
    expect(actions.getSessions).not.toHaveBeenCalled();
  });
});

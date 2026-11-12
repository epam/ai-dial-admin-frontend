import { beforeEach, describe, expect, test, vi } from 'vitest';

import Page from '@/src/app/[lang]/sessions/[id]/page';
import {
  getEnrichmentTagOrders,
  getSessionDetail,
  getSessionFeedback,
  getHopBodyGrants,
  getSessionsSchema,
  getSessionsSource,
} from '@/src/app/[lang]/sessions/actions';
import { SessionsRole, SessionsSourceProblem } from '@/src/models/analytics/sessions-source';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { defaultSessionsSource } from '@/src/utils/analytics/sessions-source';

vi.mock('@/src/app/[lang]/sessions/actions');
vi.mock('@/src/server/analytics/analytics-access');
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn(), errorLog: vi.fn() }));

const notFoundError = new Error('NEXT_NOT_FOUND');
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw notFoundError;
  },
}));

const CHAT_ID = 'Lrr0e6L5bpTND3IY_dN0_';

const DETAIL_ROW = {
  client_session_id: CHAT_ID,
  project_id: '',
  user_hash: 'db73',
  turn_count: 1,
  first_request_time: '2026-07-22T11:50:28.506Z',
  last_request_time: '2026-07-22T12:00:52.157Z',
  prompt_tokens: 1,
  completion_tokens: 2,
  total_tokens: 3,
  total_price: '0.1',
  success_count: 1,
  duration_ms: 0,
  avg_duration_ms: 0,
  deployments: ['anthropic.claude-opus-4-8'],
  traces: ['0a3f1d9c8b7e6a5f'],
  client_session_source: 'chat_id',
  'session_insights.title': 'Refund policy for EU orders',
};

const forbidden = () => isAnalyticsForbidden as unknown as ReturnType<typeof vi.fn>;
const detail = () => getSessionDetail as unknown as ReturnType<typeof vi.fn>;
const feedback = () => getSessionFeedback as unknown as ReturnType<typeof vi.fn>;
const schema = () => getSessionsSchema as unknown as ReturnType<typeof vi.fn>;
const availability = () => getHopBodyGrants as unknown as ReturnType<typeof vi.fn>;
const sourceOf = () => getSessionsSource as unknown as ReturnType<typeof vi.fn>;
const tagOrders = () => getEnrichmentTagOrders as unknown as ReturnType<typeof vi.fn>;

const SCHEMA_FIELDS = Object.keys(DETAIL_ROW).map((name) => ({ name, type: 'string', source: 'sessions' }));

const render = (id: string) => Page({ params: Promise.resolve({ id }) });

const componentName = (node: Awaited<ReturnType<typeof render>>): string => {
  const type = (node as unknown as { type: { name?: string } }).type;
  return type?.name ?? '';
};

const propsOf = (node: Awaited<ReturnType<typeof render>>): Record<string, unknown> =>
  (node as unknown as { props: Record<string, unknown> }).props;

const grantsOfNode = (node: Awaited<ReturnType<typeof render>>): Record<string, boolean> =>
  (node as unknown as { props: { bodyGrants: Record<string, boolean> } }).props.bodyGrants;

beforeEach(() => {
  vi.clearAllMocks();
  forbidden().mockResolvedValue(false);
  detail().mockResolvedValue({ success: true, response: { session: DETAIL_ROW } });
  feedback().mockResolvedValue({
    success: true,
    response: { rows: [], total: 0, isCommentTextReadable: false, isAvailable: true },
  });
  sourceOf().mockResolvedValue({ source: defaultSessionsSource(), failure: null });
  tagOrders().mockResolvedValue({});
  schema().mockResolvedValue({ success: true, response: { fields: SCHEMA_FIELDS } });
  availability().mockResolvedValue({
    success: true,
    response: { isRequestReadable: true, isResponseReadable: true },
  });
});

describe('session detail route', () => {
  test('renders the forbidden view when analytics access is denied', async () => {
    forbidden().mockResolvedValue(true);

    expect(componentName(await render(CHAT_ID))).toBe('Page403');
    expect(detail()).not.toHaveBeenCalled();
  });

  test('renders the detail view for an existing session', async () => {
    expect(componentName(await render(CHAT_ID))).toBe('SessionDetailView');
  });

  // The action reports a failed query inside its response, so `if (!row) notFound()` would turn every
  // backend outage into "this session does not exist".
  test('a failed query renders the error state rather than not-found', async () => {
    detail().mockResolvedValue({ success: false, errorMessage: 'boom' });

    expect(componentName(await render(CHAT_ID))).toBe('SessionDetailError');
  });

  test('a successful query with no session calls notFound', async () => {
    detail().mockResolvedValue({ success: true, response: { session: null } });

    await expect(render(CHAT_ID)).rejects.toBe(notFoundError);
  });

  // The request layer lets a connection refusal reject rather than reporting it in the payload, so the
  // route must survive a thrown error, not only a `success: false` one.
  test('a thrown query error renders the error state, not a crash', async () => {
    detail().mockRejectedValue(new TypeError('fetch failed'));

    expect(componentName(await render(CHAT_ID))).toBe('SessionDetailError');
  });

  test('a rejected feedback query still renders the session', async () => {
    feedback().mockRejectedValue(new TypeError('fetch failed'));

    const node = await render(CHAT_ID);

    expect(componentName(node)).toBe('SessionDetailView');
    expect(propsOf(node).feedback).toBeNull();
  });

  test('a failed feedback query still renders the session', async () => {
    feedback().mockResolvedValue({ success: false, errorMessage: 'boom' });

    expect(componentName(await render(CHAT_ID))).toBe('SessionDetailView');
  });

  test('decodes an id containing a path separator', async () => {
    const raw = 'sessions%2FeRxsos%2Fchathub-claude4';

    await render(raw);

    expect(detail()).toHaveBeenCalledWith('sessions/eRxsos/chathub-claude4');
  });

  test('decodes an id carrying percent-encoded query text', async () => {
    const raw = 'chat%2Fen%2Fgive%2520me%2520gdp-1786535692111';

    await render(raw);

    expect(detail()).toHaveBeenCalledWith('chat/en/give%20me%20gdp-1786535692111');
  });

  test('reads the rated responses over the session scope and its own window', async () => {
    await render(CHAT_ID);

    expect(feedback()).toHaveBeenCalledWith(
      { id: CHAT_ID, source: 'chat_id' },
      DETAIL_ROW.first_request_time,
      DETAIL_ROW.last_request_time,
    );
  });

  test('reads no feedback for a session that does not exist', async () => {
    detail().mockResolvedValue({ success: true, response: { session: null } });

    await expect(render(CHAT_ID)).rejects.toBe(notFoundError);
    expect(feedback()).not.toHaveBeenCalled();
  });

  test('passes the resolved source and one panel per enrichment to the view', async () => {
    const fields = [
      ...SCHEMA_FIELDS,
      { name: 'quality.verdict', type: 'string', source: 'verdict', tag: 'risk' },
      { name: 'quality.engine', type: 'string', source: 'engine', tag: 'system' },
    ];
    schema().mockResolvedValue({ success: true, response: { fields } });
    sourceOf().mockResolvedValue({
      source: { ...defaultSessionsSource(), enrichments: ['session_insights', 'quality'] },
      failure: null,
    });
    tagOrders().mockResolvedValue({ quality: ['system'] });

    const props = propsOf(await render(CHAT_ID));
    const panels = props.enrichmentPanels as { namespace: string; groups: { tag: string }[] }[];

    expect(tagOrders()).toHaveBeenCalledWith(['session_insights', 'quality']);
    expect(panels.map(({ namespace }) => namespace)).toEqual(['session_insights', 'quality']);
    expect(panels[1].groups.map(({ tag }) => tag)).toEqual(['risk', 'system']);
    expect(props.enrichmentProvenance).toEqual({ session_insights: 'insights', quality: expect.any(String) });
    expect(props.source).toMatchObject({ baseTable: 'sessions' });
  });

  test('asks no tag order of the session rating enrichment', async () => {
    sourceOf().mockResolvedValue({
      source: {
        ...defaultSessionsSource(),
        enrichments: ['session_insights', 'session_ratings'],
        ratingEnrichment: 'session_ratings',
      },
      failure: null,
    });

    await render(CHAT_ID);

    expect(tagOrders()).toHaveBeenCalledWith(['session_insights']);
  });

  test('renders the session without enrichment panels when the schema cannot be read', async () => {
    schema().mockResolvedValue({ success: false });

    const node = await render(CHAT_ID);

    expect(componentName(node)).toBe('SessionDetailView');
    expect(propsOf(node).enrichmentPanels).toEqual([]);
  });

  test('renders the session when the schema read rejects', async () => {
    schema().mockRejectedValue(new TypeError('fetch failed'));

    expect(componentName(await render(CHAT_ID))).toBe('SessionDetailView');
    expect(detail()).toHaveBeenCalledWith(CHAT_ID);
  });

  test('issues the session read without waiting for the schema', async () => {
    let releaseSchema: (value: unknown) => void = () => undefined;
    schema().mockReturnValue(
      new Promise((resolve) => {
        releaseSchema = resolve;
      }),
    );

    const pending = render(CHAT_ID);
    await vi.waitFor(() => expect(detail()).toHaveBeenCalledWith(CHAT_ID));

    releaseSchema({ success: true, response: { fields: SCHEMA_FIELDS } });

    expect(componentName(await pending)).toBe('SessionDetailView');
  });

  test('renders the session when the tag orders cannot be read', async () => {
    tagOrders().mockRejectedValue(new TypeError('fetch failed'));

    expect(componentName(await render(CHAT_ID))).toBe('SessionDetailView');
  });

  test('a required role the schema does not report fails the page with its name before any session query', async () => {
    sourceOf().mockResolvedValue({ source: null, failure: { role: SessionsRole.Time, field: 'ended_at' } });

    const node = await render(CHAT_ID);

    expect(componentName(node)).toBe('SessionsSourceError');
    expect(propsOf(node).failure).toEqual({ role: SessionsRole.Time, field: 'ended_at' });
    expect(detail()).not.toHaveBeenCalled();
    expect(schema()).not.toHaveBeenCalled();
    expect(feedback()).not.toHaveBeenCalled();
  });

  test('a setting that cannot be read fails the page with the source error before any session query', async () => {
    sourceOf().mockResolvedValue({ source: null, failure: null, problem: SessionsSourceProblem.SettingUnreadable });

    const node = await render(CHAT_ID);

    expect(componentName(node)).toBe('SessionsSourceError');
    expect(propsOf(node).problem).toBe(SessionsSourceProblem.SettingUnreadable);
    expect(detail()).not.toHaveBeenCalled();
  });

  test('a source that cannot be resolved renders the error state before any session query', async () => {
    sourceOf().mockRejectedValue(new TypeError('fetch failed'));

    expect(componentName(await render(CHAT_ID))).toBe('SessionDetailError');
    expect(detail()).not.toHaveBeenCalled();
  });

  // The bodies are one region of a trace. A session whose header, panels, figures and trace listing all
  // resolved must still render when only the body-column probe failed — the trace states the withheld bodies
  // itself rather than the page failing over them.
  test('a failed availability probe renders the session with no body column granted', async () => {
    availability().mockResolvedValue({
      success: false,
      response: { isRequestReadable: false, isResponseReadable: false },
    });
    const node = await render(CHAT_ID);

    expect(componentName(node)).toBe('SessionDetailView');
    expect(grantsOfNode(node)).toEqual({ isRequestReadable: false, isResponseReadable: false });
  });

  test('a rejected availability probe renders the session with no body column granted', async () => {
    availability().mockRejectedValue(new Error('hop log unavailable'));
    const node = await render(CHAT_ID);

    expect(componentName(node)).toBe('SessionDetailView');
    expect(grantsOfNode(node)).toEqual({ isRequestReadable: false, isResponseReadable: false });
  });

  test('passes the per-side body grants and no combined transcript flag', async () => {
    const node = await render(CHAT_ID);

    expect(grantsOfNode(node)).toEqual({ isRequestReadable: true, isResponseReadable: true });
    expect(node as unknown as { props: Record<string, unknown> }).not.toHaveProperty('props.isTranscriptReadable');
  });

  // The bodies are read on demand for the one span a reader opens, so the page issues only the cached schema
  // probe — a body-read failure is the span's own to state, not the page's.
  test('issues the availability probe and no transcript body read', async () => {
    await render(CHAT_ID);

    expect(availability()).toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, test, vi } from 'vitest';

import { analyticsDataApi } from '@/src/app/api/api';
import {
  getConversationHopBodies,
  getConversationTranscript,
  getConversations,
  getConversationsSchema,
} from '@/src/app/[lang]/conversations-trace/actions';
import { FEEDBACK_CANDIDATE_LIMIT } from '@/src/constants/analytics/conversations-trace';
import {
  ConversationFilterOperator,
  ConversationFilters,
  ConversationPageRequest,
  ConversationsField,
  FeedbackFilter,
  HopTextsState,
  TranscriptState,
  UsageLogField,
} from '@/src/models/analytics/conversations-trace';
import { QueryMode, QueryOperator, QuerySortDirection, StructuredQuery } from '@/src/models/analytics/query';
import { clearEntitySchemaCache } from '@/src/server/analytics/entity-schema-cache';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

const END_MS = Date.parse('2026-07-28T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

const FILTERS: ConversationFilters = {
  search: '',
  startMs: END_MS - 7 * DAY_MS,
  endMs: END_MS,
  feedback: FeedbackFilter.All,
};

const REQUEST: ConversationPageRequest = { ...FILTERS, offset: 0, limit: 100 };
const LATER_PAGE: ConversationPageRequest = { ...FILTERS, offset: 100, limit: 100 };

const CONVERSATION_ROW = {
  chat_id: 'a',
  project_id: 'p',
  user_hash: 'db7327ba3decd351',
  turn_count: 1,
  total_tokens: 2,
  total_price: '0.1',
  last_request_time: '2026-07-28T11:00:00.000Z',
  first_request_time: '2026-07-28T10:00:00.000Z',
};

const execute = () => analyticsDataApi.executeAction as unknown as ReturnType<typeof vi.fn>;

const ok = (rows: object[]) => ({ success: true, response: { rows } });

const failure = { success: false, status: 500, errorMessage: 'boom' };

// One fetch cycle now issues up to four differently shaped queries, two of them concurrently, so tests
// say what each query answers rather than depending on the order they happen to run in.
enum QueryKind {
  List = 'list',
  Totals = 'totals',
  Candidates = 'candidates',
  Ratings = 'ratings',
}

const kindOf = (query: StructuredQuery): QueryKind => {
  if (query.entity === 'rate_analytics') {
    const isCandidates = (query.select ?? []).some((column) => column.as === 'last_rated');
    return isCandidates ? QueryKind.Candidates : QueryKind.Ratings;
  }
  return query.mode === QueryMode.Aggregate ? QueryKind.Totals : QueryKind.List;
};

interface Stubs {
  list?: object;
  totals?: object;
  candidates?: object;
  ratings?: object[];
}

const stub = ({ list = ok([]), totals = ok([{ conversations: 0, cost: null }]), candidates, ratings }: Stubs = {}) => {
  let ratingCall = 0;
  execute().mockImplementation((query: StructuredQuery) => {
    switch (kindOf(query)) {
      case QueryKind.Candidates:
        return Promise.resolve(candidates ?? ok([]));
      case QueryKind.Totals:
        return Promise.resolve(totals);
      case QueryKind.Ratings:
        return Promise.resolve(ratings?.[ratingCall++] ?? ok([]));
      default:
        return Promise.resolve(list);
    }
  });
};

const issued = (kind: QueryKind): StructuredQuery[] =>
  execute()
    .mock.calls.map((args) => args[0] as StructuredQuery)
    .filter((query) => kindOf(query) === kind);

const queryOf = (kind: QueryKind): StructuredQuery => issued(kind)[0];

beforeEach(() => {
  vi.clearAllMocks();
  clearEntitySchemaCache();
  (getUserToken as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(TOKEN_MOCK);
  (getIsEnableAuthToggle as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
});

describe('getConversations', () => {
  test('queries the conversations entity in row mode with the caller token', async () => {
    stub({ list: ok([CONVERSATION_ROW]) });

    await getConversations(REQUEST);

    expect(execute()).toHaveBeenCalledWith(
      expect.objectContaining({ entity: 'conversations', mode: QueryMode.Row }),
      TOKEN_MOCK,
    );
  });

  test('carries the requested offset and limit into the query page', async () => {
    stub();

    await getConversations({ ...REQUEST, offset: 200, limit: 100 });

    expect(queryOf(QueryKind.List).page).toMatchObject({ offset: 200, limit: 100 });
  });

  test('resolves ratings for exactly the returned page', async () => {
    stub({
      list: ok([CONVERSATION_ROW]),
      ratings: [ok([{ chat_id: 'a', rating_count: 2 }]), ok([{ chat_id: 'a', rating_count: 1 }])],
    });

    const result = await getConversations(REQUEST);

    expect(issued(QueryKind.Ratings)).toHaveLength(2);
    expect(result.response?.rows[0]).toMatchObject({ rating_up: 2, rating_down: 1 });
  });

  test('skips the rating queries entirely when the page is empty', async () => {
    stub();

    await getConversations(REQUEST);

    expect(issued(QueryKind.Ratings)).toHaveLength(0);
  });

  // Either direction missing leaves the split unknowable, so a half-counted rating must not be shown.
  test('leaves ratings unresolved when a direction fails, still returning the rows', async () => {
    stub({ list: ok([CONVERSATION_ROW]), ratings: [ok([{ chat_id: 'a', rating_count: 2 }]), failure] });

    const result = await getConversations(REQUEST);

    expect(result.success).toBe(true);
    expect(result.response?.rows[0]).toMatchObject({ rating_up: null, rating_down: null });
  });

  // The failure still propagates, but the summary is its own query — so whatever it resolved comes back
  // with the failure rather than being discarded alongside the rows.
  test('propagates a failed list query, carrying no rows but the summary it resolved', async () => {
    stub({ list: failure, totals: ok([{ conversations: 212, cost: null }]) });

    const result = await getConversations(REQUEST);

    expect(result.success).toBe(false);
    expect(result.response?.rows).toEqual([]);
    expect(result.response?.totals).toEqual({ conversations: 212, cost: null });
  });
});

describe('getConversations :: the result total', () => {
  // The totals query resolves the same count under the same filter, so asking the list query for one too
  // would scan the filtered result a second time on every page fetched.
  test('never asks the list query for a total', async () => {
    stub();

    await getConversations(REQUEST);
    await getConversations(LATER_PAGE);

    issued(QueryKind.List).forEach((query) => expect(query.page).toMatchObject({ include_total: false }));
  });

  test('reports the total from the summary the same request resolved', async () => {
    stub({ list: ok([CONVERSATION_ROW]), totals: ok([{ conversations: 1886, cost: 654.07 }]) });

    const result = await getConversations(REQUEST);

    expect(result.response?.total).toBe(1886);
    expect(result.response?.totals).toEqual({ conversations: 1886, cost: 654.07 });
  });

  test('coerces a summary count the service reported as a string', async () => {
    stub({ totals: ok([{ conversations: '212', cost: null }]) });

    const result = await getConversations(REQUEST);

    expect(result.response?.total).toBe(212);
  });

  test('aggregates the count and cost under the list query filter', async () => {
    stub();

    await getConversations(REQUEST);

    expect(queryOf(QueryKind.Totals)).toMatchObject({ entity: 'conversations', mode: QueryMode.Aggregate });
    expect(queryOf(QueryKind.Totals).group_by).toBeUndefined();
  });

  test('the totals query carries the column filters too', async () => {
    stub();

    await getConversations({
      ...REQUEST,
      columnFilters: [
        { field: ConversationsField.TurnCount, operator: ConversationFilterOperator.GreaterThan, value: '2' },
      ],
    });

    expect(JSON.stringify(queryOf(QueryKind.Totals).filter)).toContain(ConversationsField.TurnCount);
  });

  test('reports absent figures as null rather than zero', async () => {
    stub({ totals: ok([]) });

    const result = await getConversations(REQUEST);

    expect(result.response?.totals).toEqual({ conversations: null, cost: null });
  });

  // A row failure is no evidence about the figures and vice versa: each is resolved by its own query.
  test('a failed summary leaves the rows standing and omits the figures', async () => {
    stub({ list: ok([CONVERSATION_ROW]), totals: failure });

    const result = await getConversations(REQUEST);

    expect(result.success).toBe(true);
    expect(result.response?.rows).toHaveLength(1);
    expect(result.response?.totals).toBeUndefined();
    expect(result.response?.total).toBeNull();
  });

  test('a later page resolves no summary at all', async () => {
    stub({ list: ok([CONVERSATION_ROW]) });

    const result = await getConversations(LATER_PAGE);

    expect(issued(QueryKind.Totals)).toHaveLength(0);
    expect(result.response?.totals).toBeUndefined();
  });

  // Sequencing the summary after the rows would make the merged call slower than the two separate
  // requests it replaces, so both are in flight before either resolves.
  test('runs the row query and the summary query concurrently', async () => {
    const inFlight: string[] = [];
    let releaseList = (): void => undefined;
    const listGate = new Promise((resolve) => {
      releaseList = () => resolve(ok([]));
    });

    execute().mockImplementation((query: StructuredQuery) => {
      inFlight.push(kindOf(query));
      return kindOf(query) === QueryKind.List ? listGate : Promise.resolve(ok([]));
    });

    const pending = getConversations(REQUEST);
    await Promise.resolve();

    expect(inFlight).toContain(QueryKind.Totals);

    releaseList();
    await pending;
  });
});

describe('getConversations :: the feedback candidates', () => {
  test('resolves the candidates itself on the first page and returns them', async () => {
    stub({ candidates: ok([{ chat_id: 'a' }, { chat_id: 'b' }]) });

    const result = await getConversations({ ...REQUEST, feedback: FeedbackFilter.Positive });

    expect(queryOf(QueryKind.Candidates).entity).toBe('rate_analytics');
    expect(result.response?.candidates?.ids).toEqual(['a', 'b']);
  });

  test('narrows the list query by the candidates it resolved', async () => {
    stub({ candidates: ok([{ chat_id: 'a' }]) });

    await getConversations({ ...REQUEST, feedback: FeedbackFilter.Positive });

    const args = (queryOf(QueryKind.List).filter as { args: { op: QueryOperator }[] }).args;
    expect(args.some((node) => node.op === QueryOperator.In)).toBe(true);
  });

  test('drops blank and non-string ids', async () => {
    stub({ candidates: ok([{ chat_id: '' }, { chat_id: null }, { chat_id: 'a' }]) });

    const result = await getConversations({ ...REQUEST, feedback: FeedbackFilter.Rated });

    expect(result.response?.candidates?.ids).toEqual(['a']);
  });

  test('reports an uncapped candidate set', async () => {
    stub({ candidates: ok([{ chat_id: 'a' }]) });

    const result = await getConversations({ ...REQUEST, feedback: FeedbackFilter.Positive });

    expect(result.response?.candidates?.isCapped).toBe(false);
  });

  test('reports a candidate set that reached the limit', async () => {
    const rows = Array.from({ length: FEEDBACK_CANDIDATE_LIMIT }, (_unused, index) => ({ chat_id: `c${index}` }));
    stub({ candidates: ok(rows) });

    const result = await getConversations({ ...REQUEST, feedback: FeedbackFilter.Positive });

    expect(result.response?.candidates?.isCapped).toBe(true);
  });

  test('propagates a failed candidate query without running the list query', async () => {
    stub({ candidates: failure });

    const result = await getConversations({ ...REQUEST, feedback: FeedbackFilter.Positive });

    expect(issued(QueryKind.List)).toHaveLength(0);
    expect(result.success).toBe(false);
    expect(result.response).toBeUndefined();
  });

  // An active feedback state narrows by `in`; building the query without ids would drop the predicate and
  // return every conversation instead of none.
  test('returns nothing without querying when no conversation carries the feedback', async () => {
    stub({ candidates: ok([]) });

    const result = await getConversations({ ...REQUEST, feedback: FeedbackFilter.Positive });

    expect(issued(QueryKind.List)).toHaveLength(0);
    expect(issued(QueryKind.Totals)).toHaveLength(0);
    expect(result.response).toMatchObject({ rows: [], total: 0, totals: { conversations: 0, cost: null } });
  });

  test('a later page reuses the ids the caller carries rather than resolving them again', async () => {
    stub({ list: ok([CONVERSATION_ROW]) });

    await getConversations({ ...LATER_PAGE, feedback: FeedbackFilter.Positive, chatIds: ['a', 'b'] });

    expect(issued(QueryKind.Candidates)).toHaveLength(0);
    const args = (queryOf(QueryKind.List).filter as { args: { op: QueryOperator }[] }).args;
    expect(args.some((node) => node.op === QueryOperator.In)).toBe(true);
  });

  test('the default feedback state resolves no candidates', async () => {
    stub();

    await getConversations(REQUEST);

    expect(issued(QueryKind.Candidates)).toHaveLength(0);
  });
});

describe('getConversations :: projection', () => {
  test('projects the source-backed fields whether or not their columns are visible', async () => {
    stub();

    await getConversations({ ...REQUEST, sourceFields: ['success_count'], visibleEnrichmentFields: [] });

    expect(JSON.stringify(queryOf(QueryKind.List).select)).toContain('success_count');
  });

  test('projects an enrichment-backed field only while its column is visible', async () => {
    stub();

    await getConversations({ ...REQUEST, visibleEnrichmentFields: ['conversation_insights.topic'] });
    const withColumn = JSON.stringify(queryOf(QueryKind.List).select);

    vi.clearAllMocks();
    stub();
    await getConversations({ ...REQUEST, visibleEnrichmentFields: [] });

    expect(withColumn).toContain('conversation_insights.topic');
    expect(JSON.stringify(queryOf(QueryKind.List).select)).not.toContain('conversation_insights.topic');
  });
});

describe('getConversations :: sort and column filters', () => {
  test('carries the caller sort keys into the query', async () => {
    stub({ list: ok([CONVERSATION_ROW]) });

    await getConversations({
      ...REQUEST,
      sort: [{ field: ConversationsField.TotalPrice, direction: QuerySortDirection.Desc }],
    });

    expect(queryOf(QueryKind.List).sort?.[0]).toMatchObject({
      field: ConversationsField.TotalPrice,
      dir: QuerySortDirection.Desc,
    });
  });

  test('carries the column filters into the query', async () => {
    stub({ list: ok([CONVERSATION_ROW]) });

    await getConversations({
      ...REQUEST,
      columnFilters: [
        { field: ConversationsField.ProjectId, operator: ConversationFilterOperator.Contains, value: 'acme' },
      ],
    });

    expect(JSON.stringify(queryOf(QueryKind.List).filter)).toContain(ConversationsField.ProjectId);
  });
});

describe('getConversationsSchema', () => {
  const getEntitySchema = () => analyticsDataApi.getEntitySchema as unknown as ReturnType<typeof vi.fn>;

  test('reads the conversations entity schema with the caller token', async () => {
    getEntitySchema().mockResolvedValue({
      fields: [{ name: 'success_count', type: 'integer', source: 'success_count' }],
    });

    const result = await getConversationsSchema();

    expect(getEntitySchema()).toHaveBeenCalledWith('conversations', TOKEN_MOCK);
    expect(result.success).toBe(true);
    expect(result.response?.fields).toHaveLength(1);
  });

  test('reports a failure so the view can say the additional columns are unavailable', async () => {
    getEntitySchema().mockResolvedValue(null);

    const result = await getConversationsSchema();

    expect(result.success).toBe(false);
    expect(result.response).toBeUndefined();
  });

  test('serves a repeated load from the cache rather than querying again', async () => {
    getEntitySchema().mockResolvedValue({ fields: [] });

    await getConversationsSchema();
    const result = await getConversationsSchema();

    expect(getEntitySchema()).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
  });
});

describe('getConversationTranscript', () => {
  const CHAT_ID = 'chat-1';
  const NOW = Date.parse('2026-08-20T00:00:00.000Z');
  const RECENT = Date.parse('2026-08-19T00:00:00.000Z');
  const getEntitySchema = () => analyticsDataApi.getEntitySchema as unknown as ReturnType<typeof vi.fn>;

  const READABLE = [UsageLogField.RequestBody, UsageLogField.ResponseBody, UsageLogField.AssembledResponse];

  const schemaOf = (names: string[]) =>
    getEntitySchema().mockResolvedValue({ fields: names.map((name) => ({ name, type: 'string', source: name })) });

  const answer = (text: string) => JSON.stringify({ choices: [{ message: { role: 'assistant', content: text } }] });

  const hopRow = (traceId: string, messageCount: number) => ({
    trace_id: traceId,
    request_time: 1787218895000,
    deployment: 'app',
    number_request_messages: messageCount,
    request_body_bytes: 10,
    response_body_bytes: 20,
  });

  const bodyRow = (traceId: string, userText: string, reply: string) => ({
    trace_id: traceId,
    event_kind: 'llm_call',
    request_body: JSON.stringify({ messages: [{ role: 'user', content: userText }] }),
    response_body: null,
    assembled_response: answer(reply),
  });

  // The three hop-log reads are told apart by shape rather than by call order, since two of them run
  // concurrently.
  const stubHopLog = (hops: object[], bodies: object[], count = hops.length) =>
    execute().mockImplementation((query: StructuredQuery) => {
      if (query.mode === QueryMode.Aggregate) {
        return Promise.resolve(ok([{ hop_count: count }]));
      }
      const names = (query.select ?? []).map((column) => (column.expr as { name?: string }).name);
      return Promise.resolve(names.includes(UsageLogField.RequestBody) ? ok(bodies) : ok(hops));
    });

  beforeEach(() => {
    clearEntitySchemaCache();
    schemaOf(READABLE);
  });

  test('assembles the transcript from the entry hops', async () => {
    stubHopLog([hopRow('t1', 1), hopRow('t2', 1)], [bodyRow('t1', 'first', 'A'), bodyRow('t2', 'second', 'B')]);

    const result = await getConversationTranscript(CHAT_ID, RECENT, NOW);

    expect(result.response?.state).toBe(TranscriptState.Available);
    expect(result.response?.messages.map(({ content }) => content)).toEqual(['first', 'A', 'second', 'B']);
    expect(result.response?.loadedTurns).toBe(2);
  });

  test('reads the hop log schema for the caller token', async () => {
    stubHopLog([], []);
    await getConversationTranscript(CHAT_ID, RECENT, NOW);

    expect(getEntitySchema()).toHaveBeenCalledWith('dial_usage_log', TOKEN_MOCK);
  });

  // The `sensitive` case: the service hides all three columns from a caller below FULL_ADMIN.
  test('reports the columns unavailable when the schema reports none of them', async () => {
    schemaOf([UsageLogField.ChatId]);

    const result = await getConversationTranscript(CHAT_ID, RECENT, NOW);

    expect(result.success).toBe(true);
    expect(result.response?.state).toBe(TranscriptState.ColumnsUnavailable);
    expect(execute()).not.toHaveBeenCalled();
  });

  // The service-version case: an older instance never persists the assembled column, so it is missing for
  // every caller — and naming it would cost the whole query.
  test('never names the assembled column when the schema omits it', async () => {
    schemaOf([UsageLogField.RequestBody, UsageLogField.ResponseBody]);
    stubHopLog([hopRow('t1', 1)], [{ ...bodyRow('t1', 'q', 'a'), assembled_response: undefined }]);

    const result = await getConversationTranscript(CHAT_ID, RECENT, NOW);
    const bodyQuery = execute()
      .mock.calls.map((args) => args[0] as StructuredQuery)
      .find((query) =>
        (query.select ?? []).some((column) => (column.expr as { name?: string }).name === UsageLogField.RequestBody),
      );

    expect(result.response?.state).toBe(TranscriptState.Available);
    expect(JSON.stringify(bodyQuery?.select)).not.toContain(UsageLogField.AssembledResponse);
  });

  test('reports a failure when the schema cannot be read', async () => {
    getEntitySchema().mockResolvedValue(null);

    const result = await getConversationTranscript(CHAT_ID, RECENT, NOW);

    expect(result.success).toBe(false);
    expect(result.response?.state).toBe(TranscriptState.LoadFailed);
  });

  // Hops exist but none entered DIAL, so nothing recorded can be attributed to the user.
  test('reports a conversation with hops but no entry hop as not reconstructable', async () => {
    stubHopLog([], [], 12);

    const result = await getConversationTranscript(CHAT_ID, RECENT, NOW);

    expect(result.response?.state).toBe(TranscriptState.NotReconstructable);
  });

  test('reports a conversation older than the retention as expired', async () => {
    stubHopLog([], [], 0);
    const aged = NOW - 400 * DAY_MS;

    expect((await getConversationTranscript(CHAT_ID, aged, NOW)).response?.state).toBe(TranscriptState.Expired);
  });

  test('reports a recent conversation with no hops as having recorded nothing', async () => {
    stubHopLog([], [], 0);

    expect((await getConversationTranscript(CHAT_ID, RECENT, NOW)).response?.state).toBe(TranscriptState.NoMessages);
  });

  // Without the count there is no way to tell an unattributable conversation from an empty one, and stating
  // either would say something the read does not support.
  test('reports a failure when the hop count fails and no entry hop was read', async () => {
    execute().mockImplementation((query: StructuredQuery) =>
      Promise.resolve(query.mode === QueryMode.Aggregate ? failure : ok([])),
    );

    const result = await getConversationTranscript(CHAT_ID, RECENT, NOW);

    expect(result.success).toBe(false);
    expect(result.response?.state).toBe(TranscriptState.LoadFailed);
  });

  test('reports a failure when the entry hop read fails', async () => {
    execute().mockResolvedValue(failure);

    expect((await getConversationTranscript(CHAT_ID, RECENT, NOW)).response?.state).toBe(TranscriptState.LoadFailed);
  });

  // The read that carries the messages themselves: without this the failure resolved to an available
  // transcript of nothing, and the view said the conversation recorded no messages during an outage.
  test('reports a failure when the body read fails, not an empty conversation', async () => {
    execute().mockImplementation((query: StructuredQuery) => {
      const names = (query.select ?? []).map((column) => (column.expr as { name?: string }).name);
      if (names.includes(UsageLogField.RequestBody)) {
        return Promise.resolve(failure);
      }
      return Promise.resolve(query.mode === QueryMode.Aggregate ? ok([{ hop_count: 1 }]) : ok([hopRow('t1', 1)]));
    });

    const result = await getConversationTranscript(CHAT_ID, RECENT, NOW);

    expect(result.success).toBe(false);
    expect(result.response?.state).toBe(TranscriptState.LoadFailed);
  });

  // Rows were read and none of them yielded a message: the conversation is not empty, it could not be
  // reconstructed — which is the state that says so.
  test('reports entry hops whose bodies yield no message as not reconstructable', async () => {
    stubHopLog([hopRow('t1', 1)], []);

    const result = await getConversationTranscript(CHAT_ID, RECENT, NOW);

    expect(result.success).toBe(true);
    expect(result.response?.state).toBe(TranscriptState.NotReconstructable);
  });

  // Under the 2n-1 shortcut only the newest row's bodies are fetched, and the transcript is the same.
  test('fetches one row of bodies when the newest entry hop carries the whole conversation', async () => {
    const hops = [hopRow('t1', 1), hopRow('t2', 3)];
    stubHopLog(hops, [
      {
        trace_id: 't2',
        event_kind: 'llm_call',
        request_body: JSON.stringify({
          messages: [
            { role: 'user', content: 'first' },
            { role: 'assistant', content: 'A' },
            { role: 'user', content: 'second' },
          ],
        }),
        response_body: null,
        assembled_response: answer('B'),
      },
    ]);

    const result = await getConversationTranscript(CHAT_ID, RECENT, NOW);
    const bodyQuery = execute()
      .mock.calls.map((args) => args[0] as StructuredQuery)
      .find((query) =>
        (query.select ?? []).some((column) => (column.expr as { name?: string }).name === UsageLogField.RequestBody),
      );

    expect(result.response?.messages.map(({ content }) => content)).toEqual(['first', 'A', 'second', 'B']);
    expect(JSON.stringify(bodyQuery?.filter)).toContain('t2');
    expect(JSON.stringify(bodyQuery?.filter)).not.toContain('t1');
  });

  // Bodies never cross to the caller: only decoded messages do.
  test('returns decoded messages and no body value', async () => {
    stubHopLog([hopRow('t1', 1)], [bodyRow('t1', 'q', 'a')]);

    const result = await getConversationTranscript(CHAT_ID, RECENT, NOW);

    expect(JSON.stringify(result.response)).not.toContain('assembled_response');
    expect(JSON.stringify(result.response)).not.toContain('request_body');
  });
});

describe('getConversationHopBodies', () => {
  const CHAT_ID = 'chat-1';
  const getEntitySchema = () => analyticsDataApi.getEntitySchema as unknown as ReturnType<typeof vi.fn>;
  const READABLE = [UsageLogField.RequestBody, UsageLogField.ResponseBody];

  const schemaOf = (names: string[]) =>
    getEntitySchema().mockResolvedValue({ fields: names.map((name) => ({ name, type: 'string', source: name })) });

  const bodyRow = (overrides: Record<string, unknown> = {}) => ({
    trace_id: 'tr1',
    event_kind: 'llm_call',
    request_body: JSON.stringify({ messages: [{ role: 'user', content: 'the prompt' }] }),
    response_body: JSON.stringify({ choices: [{ message: { content: 'the answer' } }] }),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    clearEntitySchemaCache();
    (getUserToken as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
  });

  const read = (requestTime: number | string | null = 1787052797216) =>
    getConversationHopBodies(CHAT_ID, 'tr1', 'sp1', requestTime);

  test('ships the decoded texts and no raw body', async () => {
    schemaOf(READABLE);
    execute().mockResolvedValue({ success: true, response: { rows: [bodyRow()] } });

    const result = await read();

    expect(result.response).toEqual({
      state: HopTextsState.Available,
      sent: 'the prompt',
      received: 'the answer',
      toolCalls: [],
    });
    expect(JSON.stringify(result.response)).not.toContain('choices');
  });

  // One hop at a time: the query names the hop, and the bound is its own instant.
  test('reads exactly the one hop it was asked for', async () => {
    schemaOf(READABLE);
    execute().mockResolvedValue({ success: true, response: { rows: [bodyRow()] } });

    await read();

    const query = execute().mock.calls[0][0] as StructuredQuery;
    expect(JSON.stringify(query.filter)).toContain('sp1');
    expect(JSON.stringify(query.filter)).toContain('1787052797216');
    expect(execute()).toHaveBeenCalledOnce();
    expect(execute()).toHaveBeenCalledWith(expect.anything(), TOKEN_MOCK);
  });

  // The expected non-administrator path: the columns were never offered, so the section is simply absent.
  test('reports the columns as unavailable without reading anything', async () => {
    schemaOf([UsageLogField.TraceId]);

    const result = await read();

    expect(result.success).toBe(true);
    expect(result.response?.state).toBe(HopTextsState.ColumnsUnavailable);
    expect(execute()).not.toHaveBeenCalled();
  });

  // A schema that could not be read is an outage, not a column that was withheld.
  test('reports a failure when the schema could not be read', async () => {
    getEntitySchema().mockResolvedValue(null);

    const result = await read();

    expect(result.success).toBe(false);
    expect(result.response?.state).toBe(HopTextsState.LoadFailed);
  });

  test('reports a failed read as a failure rather than as an empty hop', async () => {
    schemaOf(READABLE);
    execute().mockResolvedValue({ success: false, response: undefined });

    expect((await read()).response?.state).toBe(HopTextsState.LoadFailed);
  });

  test('reports a hop the read matched no row for', async () => {
    schemaOf(READABLE);
    execute().mockResolvedValue({ success: true, response: { rows: [] } });

    const result = await read();

    expect(result.success).toBe(true);
    expect(result.response?.state).toBe(HopTextsState.NoBodies);
  });

  test('reports a hop whose bodies decoded to nothing as recording nothing readable', async () => {
    schemaOf(READABLE);
    execute().mockResolvedValue({
      success: true,
      response: { rows: [bodyRow({ request_body: null, response_body: null })] },
    });

    expect((await read()).response?.state).toBe(HopTextsState.NoBodies);
  });

  // The tool names are the only record of what a hop that returned no text actually did.
  test('carries the requested tool names for a hop that returned no text', async () => {
    schemaOf(READABLE);
    execute().mockResolvedValue({
      success: true,
      response: {
        rows: [
          bodyRow({
            response_body: JSON.stringify({
              choices: [{ message: { content: '', tool_calls: [{ function: { name: 'rag_search' } }] } }],
            }),
          }),
        ],
      },
    });

    const result = await read();

    expect(result.response?.state).toBe(HopTextsState.Available);
    expect(result.response?.toolCalls).toEqual(['rag_search']);
  });

  test('sends no time bound for a hop that records no time', async () => {
    schemaOf(READABLE);
    execute().mockResolvedValue({ success: true, response: { rows: [bodyRow()] } });

    await read(null);

    const query = execute().mock.calls[0][0] as StructuredQuery;
    expect(JSON.stringify(query.filter)).not.toContain(QueryOperator.Ge);
  });
});

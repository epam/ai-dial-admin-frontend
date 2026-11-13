import { beforeEach, describe, expect, test, vi } from 'vitest';

import { analyticsDataApi, sessionsSourceApi } from '@/src/app/api/api';
import {
  getEnrichmentDefinitions,
  getEntityTracePage,
  getSessionFieldValues,
  getSessionHopMessage,
  getSessionHopRawBody,
  getSessionHopRequest,
  getSessionHopResponse,
  getSessions,
  getSessionsSchema,
  getSessionsSource,
} from '@/src/app/[lang]/sessions/actions';
import {
  ARRAY_VALUE_PAGE_SIZE,
  SESSION_FIELD_VALUE_COUNT_ALIAS,
  RAW_BODY_BYTE_BUDGET,
  USAGE_LOG_ENTITY,
} from '@/src/constants/analytics/sessions-trace';
import {
  SessionFieldValuesRequest,
  SessionFilterOperator,
  SessionFilters,
  SessionPageRequest,
  SessionScalarOperator,
  SessionsField,
  FeedbackFilter,
  HopInspectorSide,
  HopReadState,
  MessageRole,
  UsageLogField,
} from '@/src/models/analytics/sessions-trace';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import {
  QueryMode,
  QueryOffsetPage,
  QueryOperator,
  QuerySortDirection,
  StructuredQuery,
} from '@/src/models/analytics/query';
import { SessionsRole, SessionsSourceProblem, SessionsSourceSetting } from '@/src/models/analytics/sessions-source';
import { clearEntitySchemaCache } from '@/src/server/analytics/entity-schema-cache';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { ApplicationRoute } from '@/src/types/routes';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

const END_MS = Date.parse('2026-07-28T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

const FILTERS: SessionFilters = {
  search: '',
  startMs: END_MS - 7 * DAY_MS,
  endMs: END_MS,
  feedback: FeedbackFilter.All,
};

const REQUEST: SessionPageRequest = { ...FILTERS, offset: 0, limit: 100 };
const LATER_PAGE: SessionPageRequest = { ...FILTERS, offset: 100, limit: 100 };

const RATINGS = 'session_ratings';

const schemaField = (name: string, type = AnalyticsFieldType.String): AnalyticsEntityField => ({
  name,
  type,
  source: name.includes('.') ? name.slice(name.indexOf('.') + 1) : name,
});

const BASE_FIELDS: AnalyticsEntityField[] = [
  schemaField('client_session_id'),
  schemaField('project_id'),
  schemaField('user_hash'),
  schemaField('turn_count', AnalyticsFieldType.Long),
  schemaField('total_tokens', AnalyticsFieldType.Long),
  schemaField('total_price', AnalyticsFieldType.Decimal),
  schemaField('last_request_time', AnalyticsFieldType.Timestamp),
  schemaField('first_request_time', AnalyticsFieldType.Timestamp),
  schemaField('session_insights.title'),
];

const RATING_FIELDS: AnalyticsEntityField[] = [
  'rate_pos_count',
  'rate_zero_count',
  'rate_neg_count',
  'rate_bool_false_count',
  'rate_raw_count',
  'rate_event_count',
].map((name) => schemaField(`${RATINGS}.${name}`, AnalyticsFieldType.Long));

const SESSIONS_SCHEMA = [...BASE_FIELDS, ...RATING_FIELDS];

const CUSTOM_SETTING: SessionsSourceSetting = {
  baseTable: 'agent_runs',
  roles: {
    [SessionsRole.SessionId]: 'run_key',
    [SessionsRole.Time]: 'ended_at',
    [SessionsRole.Turns]: 'steps',
  },
};

const CUSTOM_SCHEMA = [
  schemaField('run_key'),
  schemaField('ended_at', AnalyticsFieldType.Timestamp),
  schemaField('steps', AnalyticsFieldType.Long),
  schemaField('region'),
];

const SESSION_ROW = {
  client_session_id: 'a',
  project_id: 'p',
  user_hash: 'db7327ba3decd351',
  turn_count: 1,
  total_tokens: 2,
  total_price: '0.1',
  last_request_time: '2026-07-28T11:00:00.000Z',
  first_request_time: '2026-07-28T10:00:00.000Z',
};

const ratingCounts = (counts: Record<string, number | string | null>) =>
  Object.fromEntries(Object.entries(counts).map(([name, count]) => [`${RATINGS}.${name}`, count]));

const execute = () => analyticsDataApi.executeAction as unknown as ReturnType<typeof vi.fn>;
const getEntitySchema = () => analyticsDataApi.getEntitySchema as unknown as ReturnType<typeof vi.fn>;
const getSetting = () => sessionsSourceApi.getSetting as unknown as ReturnType<typeof vi.fn>;

const ok = (rows: object[]) => ({ success: true, response: { rows } });

const failure = { success: false, status: 500, errorMessage: 'boom' };

const serveSchemas = (schemas: Record<string, AnalyticsEntityField[] | null>) =>
  getEntitySchema().mockImplementation((entity: string) =>
    Promise.resolve(schemas[entity] ? { success: true, response: { fields: schemas[entity] } } : { success: false }),
  );

const bindSource = (setting: SessionsSourceSetting | null) =>
  getSetting().mockResolvedValue(setting ? { success: true, response: setting } : { success: true });

enum QueryKind {
  List = 'list',
  Totals = 'totals',
  RatingTotals = 'ratingTotals',
  // Step one of a filter over an array-valued column: the hop log's scalar `deployment` column, grouped.
  Resolution = 'resolution',
  // The grouped count that discovers an enum column's values.
  FieldValues = 'fieldValues',
}

const aliases = (query: StructuredQuery): (string | undefined)[] => (query.select ?? []).map((column) => column.as);

const kindOf = (query: StructuredQuery): QueryKind => {
  if (query.entity === USAGE_LOG_ENTITY) {
    return QueryKind.Resolution;
  }
  if (aliases(query).includes(SESSION_FIELD_VALUE_COUNT_ALIAS)) {
    return QueryKind.FieldValues;
  }
  if (aliases(query).includes('rated_conversations')) {
    return QueryKind.RatingTotals;
  }
  return query.mode === QueryMode.Aggregate ? QueryKind.Totals : QueryKind.List;
};

// The rate predicate is all that separates the two rating aggregates.
const isNegativeRatingTotals = (query: StructuredQuery): boolean =>
  !JSON.stringify(query.filter).includes('rate_pos_count');

interface Stubs {
  list?: object;
  totals?: object;
  rated?: object;
  negative?: object;
  // A queue rather than one value: the resolution pages until a page comes back short, so a test of the
  // walk has to answer successive offsets differently.
  resolutions?: object[];
  fieldValues?: object;
}

const stub = ({
  list = ok([]),
  totals = ok([{ sessions: 0, cost: null }]),
  rated = ok([{ rated_conversations: 0 }]),
  negative = ok([{ rated_conversations: 0 }]),
  resolutions,
  fieldValues,
}: Stubs = {}) => {
  const pending = [...(resolutions ?? [])];

  execute().mockImplementation((query: StructuredQuery) => {
    switch (kindOf(query)) {
      case QueryKind.Resolution:
        return Promise.resolve(pending.shift() ?? ok([]));
      case QueryKind.FieldValues:
        return Promise.resolve(fieldValues ?? ok([]));
      case QueryKind.Totals:
        return Promise.resolve(totals);
      case QueryKind.RatingTotals:
        return Promise.resolve(isNegativeRatingTotals(query) ? negative : rated);
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

const selectNames = (query: StructuredQuery): string[] =>
  (query.select ?? []).map((column) => (column.expr as { name: string }).name);

beforeEach(() => {
  vi.resetAllMocks();
  clearEntitySchemaCache();
  (getUserToken as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(TOKEN_MOCK);
  (getIsEnableAuthToggle as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
  bindSource(null);
  serveSchemas({ sessions: SESSIONS_SCHEMA });
});

describe('getSessions', () => {
  test('queries the sessions entity in row mode with the caller token', async () => {
    stub({ list: ok([SESSION_ROW]) });

    await getSessions(REQUEST);

    expect(execute()).toHaveBeenCalledWith(
      expect.objectContaining({ entity: 'sessions', mode: QueryMode.Row }),
      TOKEN_MOCK,
    );
  });

  test('resolves the binding from the stored setting and the base table schema', async () => {
    stub();

    await getSessions(REQUEST);

    expect(getSetting()).toHaveBeenCalledWith(TOKEN_MOCK);
    expect(getEntitySchema()).toHaveBeenCalledWith('sessions', TOKEN_MOCK);
  });

  test('carries the requested offset and limit into the query page', async () => {
    stub();

    await getSessions({ ...REQUEST, offset: 200, limit: 100 });

    expect(queryOf(QueryKind.List).page).toMatchObject({ offset: 200, limit: 100 });
  });

  test('reads both rating directions off the session rows, issuing no rating query of its own', async () => {
    stub({ list: ok([{ ...SESSION_ROW, ...ratingCounts({ rate_pos_count: 2, rate_neg_count: 1 }) }]) });

    const result = await getSessions(REQUEST);

    expect(result.response?.rows[0]).toMatchObject({ rating_up: 2, rating_down: 1 });
    expect(execute().mock.calls.every(([query]) => (query as StructuredQuery).entity === 'sessions')).toBe(true);
  });

  test('projects the rating enrichment counts in the list query', async () => {
    stub();

    await getSessions(REQUEST);

    expect(selectNames(queryOf(QueryKind.List))).toEqual(expect.arrayContaining(RATING_FIELDS.map(({ name }) => name)));
  });

  test('carries the caveat figures onto the row', async () => {
    stub({
      list: ok([
        {
          ...SESSION_ROW,
          ...ratingCounts({ rate_zero_count: 4, rate_bool_false_count: 1, rate_raw_count: 1, rate_event_count: 4 }),
        },
      ]),
    });

    const result = await getSessions(REQUEST);

    expect(result.response?.rows[0]).toMatchObject({ rating_down: 4, provable_down: 1, captured_form: 1 });
  });

  test('reads a session the enrichment has no row for as unrated', async () => {
    stub({ list: ok([SESSION_ROW]) });

    const result = await getSessions(REQUEST);

    expect(result.response?.rows[0]).toMatchObject({ rating_up: 0, rating_down: 0 });
  });

  test('leaves ratings unresolved where the schema reports no rating enrichment, still returning the rows', async () => {
    serveSchemas({ sessions: BASE_FIELDS });
    stub({ list: ok([SESSION_ROW]) });

    const result = await getSessions(REQUEST);

    expect(result.success).toBe(true);
    expect(result.response?.rows[0]).toMatchObject({ client_session_id: 'a', rating_up: null, rating_down: null });
  });

  test('propagates a failed list query, carrying no rows but the figures it resolved', async () => {
    stub({ list: failure, totals: ok([{ sessions: 212, cost: null }]) });

    const result = await getSessions(REQUEST);

    expect(result.success).toBe(false);
    expect(result.response?.rows).toEqual([]);
    expect(result.response?.period?.totals).toEqual({ sessions: 212, cost: null });
  });
});

describe('getSessions :: a custom source', () => {
  beforeEach(() => {
    bindSource(CUSTOM_SETTING);
    serveSchemas({ agent_runs: CUSTOM_SCHEMA });
  });

  test('reads the bound base table and its schema', async () => {
    stub();

    await getSessions(REQUEST);

    expect(getEntitySchema()).toHaveBeenCalledWith('agent_runs', TOKEN_MOCK);
    expect(queryOf(QueryKind.List).entity).toBe('agent_runs');
  });

  test('projects the role-bound fields and bounds the period by the Time field', async () => {
    stub();

    await getSessions({ ...REQUEST, sourceFields: ['region'] });

    const list = queryOf(QueryKind.List);
    expect(selectNames(list)).toEqual(expect.arrayContaining(['run_key', 'ended_at', 'steps', 'region']));
    expect(JSON.stringify(list.filter)).toContain('"ended_at"');
    expect(JSON.stringify(list.filter)).not.toContain(SessionsField.LastRequestTime);
  });

  test('returns rows keyed by the canonical names as well as the bound ones', async () => {
    stub({ list: ok([{ run_key: 'r-1', ended_at: 5, steps: 3, region: 'eu' }]) });

    const result = await getSessions(REQUEST);

    expect(result.response?.rows[0]).toMatchObject({
      run_key: 'r-1',
      client_session_id: 'r-1',
      last_request_time: 5,
      turn_count: 3,
      region: 'eu',
    });
  });

  test('sums no cost without a Cost role and issues no rating aggregate without a rating enrichment', async () => {
    stub();

    await getSessions(REQUEST);

    expect(JSON.stringify(queryOf(QueryKind.Totals).select)).not.toContain('sum');
    expect(issued(QueryKind.RatingTotals)).toHaveLength(0);
  });

  test('carries no feedback predicate without a rating enrichment', async () => {
    stub();

    await getSessions({ ...REQUEST, feedback: FeedbackFilter.Positive });

    expect(JSON.stringify(queryOf(QueryKind.List).filter)).not.toContain('rate_');
  });
});

describe('getSessions :: a required role that does not resolve', () => {
  test('fails without querying and names the role and the field', async () => {
    bindSource({
      baseTable: 'agent_runs',
      roles: { [SessionsRole.SessionId]: 'run_key', [SessionsRole.Time]: 'gone' },
    });
    serveSchemas({ agent_runs: CUSTOM_SCHEMA });
    stub();

    const result = await getSessions(REQUEST);

    expect(result).toEqual({ success: false, errorMessage: `${SessionsRole.Time}: gone` });
    expect(execute()).not.toHaveBeenCalled();
  });

  test('fails when the bound field has a type its role cannot take', async () => {
    bindSource({
      baseTable: 'agent_runs',
      roles: { [SessionsRole.SessionId]: 'run_key', [SessionsRole.Time]: 'region' },
    });
    serveSchemas({ agent_runs: CUSTOM_SCHEMA });

    const result = await getSessions(REQUEST);

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe(`${SessionsRole.Time}: region`);
  });
});

describe('getSessionsSource', () => {
  test('resolves the default binding when nothing is stored', async () => {
    const resolution = await getSessionsSource();

    expect(resolution.failure).toBeNull();
    expect(resolution.source).toMatchObject({
      baseTable: 'sessions',
      sessionId: SessionsField.ChatId,
      time: SessionsField.LastRequestTime,
      cost: SessionsField.TotalPrice,
      ratingEnrichment: RATINGS,
    });
  });

  test('fails without a source rather than falling back to the default when the setting cannot be read', async () => {
    getSetting().mockResolvedValue({ success: false, status: 403, errorMessage: 'Access denied' });

    expect(await getSessionsSource()).toEqual({
      source: null,
      failure: null,
      problem: SessionsSourceProblem.SettingUnreadable,
    });
    expect(getEntitySchema()).not.toHaveBeenCalled();
  });

  test('fails the session query without querying when the setting cannot be read', async () => {
    getSetting().mockResolvedValue({ success: false, status: 403 });

    const result = await getSessions(REQUEST);

    expect(result.success).toBe(false);
    expect(execute()).not.toHaveBeenCalled();
  });

  test('reports Sessions as not set up when nothing is stored and the default table does not exist', async () => {
    getEntitySchema().mockResolvedValue({ success: false, status: 404 });

    expect(await getSessionsSource()).toEqual({
      source: null,
      failure: null,
      problem: SessionsSourceProblem.DefaultTableMissing,
    });
  });

  test('keeps the default source when the default table schema fails for another reason', async () => {
    getEntitySchema().mockResolvedValue({ success: false, status: 500 });

    const resolution = await getSessionsSource();

    expect(resolution.problem).toBeUndefined();
    expect(resolution.source?.baseTable).toBe('sessions');
  });

  test('reports the setting read failure as the schema read failure', async () => {
    getSetting().mockResolvedValue({ success: false, status: 403, errorMessage: 'Access denied' });

    expect(await getSessionsSchema()).toEqual(
      expect.objectContaining({ success: false, status: 403, errorMessage: 'Access denied' }),
    );
  });

  test('resolves a stored binding against the caller schema, leaving unbound roles null', async () => {
    bindSource(CUSTOM_SETTING);
    serveSchemas({ agent_runs: CUSTOM_SCHEMA });

    const resolution = await getSessionsSource();

    expect(resolution.source).toMatchObject({
      baseTable: 'agent_runs',
      sessionId: 'run_key',
      time: 'ended_at',
      turns: 'steps',
      project: null,
      cost: null,
      ratingEnrichment: null,
    });
  });

  test('reports the failing role and field', async () => {
    bindSource({
      baseTable: 'agent_runs',
      roles: { [SessionsRole.SessionId]: 'gone', [SessionsRole.Time]: 'ended_at' },
    });
    serveSchemas({ agent_runs: CUSTOM_SCHEMA });

    const resolution = await getSessionsSource();

    expect(resolution).toEqual({ source: null, failure: { role: SessionsRole.SessionId, field: 'gone' } });
  });
});

describe('getSessions :: the period figures', () => {
  test('aggregates the count and cost over the period', async () => {
    stub();

    await getSessions(REQUEST);

    expect(queryOf(QueryKind.Totals)).toMatchObject({ entity: 'sessions', mode: QueryMode.Aggregate });
    expect(queryOf(QueryKind.Totals).group_by).toBeUndefined();
  });

  test('returns the count, the cost and both rating figures together', async () => {
    stub({
      totals: ok([{ sessions: 1886, cost: 654.07 }]),
      rated: ok([{ rated_conversations: 19 }]),
      negative: ok([{ rated_conversations: 13 }]),
    });

    const result = await getSessions(REQUEST);

    expect(result.response?.period).toEqual({
      totals: { sessions: 1886, cost: 654.07 },
      ratings: { rated: 19, negative: 13 },
    });
  });

  test('aggregates the rating figures over the base entity', async () => {
    stub();

    await getSessions(REQUEST);

    issued(QueryKind.RatingTotals).forEach((query) => expect(query.entity).toBe('sessions'));
  });

  test('reports no rating figures where the schema reports no rating enrichment', async () => {
    serveSchemas({ sessions: BASE_FIELDS });
    stub({ totals: ok([{ sessions: 3, cost: 1 }]) });

    const result = await getSessions(REQUEST);

    expect(issued(QueryKind.RatingTotals)).toHaveLength(0);
    expect(result.response?.period).toEqual({ totals: { sessions: 3, cost: 1 } });
  });

  // A search or column predicate reaching the totals query would make the pills a summary of the filtered result.
  test('the totals query ignores the search term and the column filters', async () => {
    stub();

    await getSessions({
      ...REQUEST,
      search: 'acme',
      columnFilters: [{ field: SessionsField.TurnCount, operator: SessionFilterOperator.GreaterThan, value: '2' }],
    });

    const filter = JSON.stringify(queryOf(QueryKind.Totals).filter);

    expect(filter).not.toContain(SessionsField.TurnCount);
    expect(filter).not.toContain('acme');
  });

  test('the rating totals are unmoved by the search term', async () => {
    stub();

    await getSessions({ ...REQUEST, search: 'acme' });

    issued(QueryKind.RatingTotals).forEach((query) => {
      expect(JSON.stringify(query.filter)).not.toContain('acme');
    });
  });

  test('issues one rating aggregate per rate predicate', async () => {
    stub();

    await getSessions(REQUEST);

    expect(issued(QueryKind.RatingTotals)).toHaveLength(2);
  });

  test('coerces rating figures the service reported as strings', async () => {
    stub({ rated: ok([{ rated_conversations: '19' }]), negative: ok([{ rated_conversations: '13' }]) });

    const result = await getSessions(REQUEST);

    expect(result.response?.period?.ratings).toEqual({ rated: 19, negative: 13 });
  });

  test('reports absent figures as null rather than zero', async () => {
    stub({ totals: ok([]) });

    const result = await getSessions(REQUEST);

    expect(result.response?.period?.totals).toEqual({ sessions: null, cost: null });
  });

  test('a failed rating aggregate leaves the count and cost standing', async () => {
    stub({ totals: ok([{ sessions: 212, cost: 1 }]), rated: failure });

    const result = await getSessions(REQUEST);

    expect(result.success).toBe(true);
    expect(result.response?.period?.totals).toEqual({ sessions: 212, cost: 1 });
    expect(result.response?.period?.ratings).toBeUndefined();
  });

  test('a failed totals aggregate leaves the rating figures standing', async () => {
    stub({ totals: failure, rated: ok([{ rated_conversations: 19 }]), negative: ok([{ rated_conversations: 13 }]) });

    const result = await getSessions(REQUEST);

    expect(result.success).toBe(true);
    expect(result.response?.period?.totals).toBeUndefined();
    expect(result.response?.period?.ratings).toEqual({ rated: 19, negative: 13 });
  });

  // A row failure is no evidence about the figures and vice versa: each is resolved by its own query.
  test('a failed summary leaves the rows standing', async () => {
    stub({ list: ok([SESSION_ROW]), totals: failure, rated: failure, negative: failure });

    const result = await getSessions(REQUEST);

    expect(result.success).toBe(true);
    expect(result.response?.rows).toHaveLength(1);
    expect(result.response?.period).toEqual({});
  });

  // A feedback filter selecting nothing empties the grid, not the period; zeroes would assert an empty period.
  test('reports the period even when the feedback filter selects nothing', async () => {
    stub({ list: ok([]), totals: ok([{ sessions: 212, cost: 1 }]) });

    const result = await getSessions({ ...REQUEST, feedback: FeedbackFilter.Negative });

    expect(result.response?.rows).toEqual([]);
    expect(result.response?.period?.totals).toEqual({ sessions: 212, cost: 1 });
  });

  test('a later page resolves no figures at all', async () => {
    stub({ list: ok([SESSION_ROW]) });

    const result = await getSessions(LATER_PAGE);

    expect(issued(QueryKind.Totals)).toHaveLength(0);
    expect(issued(QueryKind.RatingTotals)).toHaveLength(0);
    expect(result.response?.period).toBeUndefined();
  });

  // Sequencing the figures after the rows would make the merged call slower than the requests it replaces.
  test('runs the row query and the period queries concurrently', async () => {
    const inFlight: string[] = [];
    let releaseList = (): void => undefined;
    const listGate = new Promise((resolve) => {
      releaseList = () => resolve(ok([]));
    });

    execute().mockImplementation((query: StructuredQuery) => {
      inFlight.push(kindOf(query));
      return kindOf(query) === QueryKind.List ? listGate : Promise.resolve(ok([]));
    });

    const pending = getSessions(REQUEST);
    await vi.waitFor(() => expect(inFlight).toContain(QueryKind.List));

    expect(inFlight).toContain(QueryKind.Totals);

    releaseList();
    await pending;
  });
});

describe('getSessions :: the grid row total', () => {
  // The period totals resolve the same count when nothing narrows, so asking the list query for one too
  // would scan the result a second time on every page fetched.
  test('never asks the list query for a total', async () => {
    stub();

    await getSessions(REQUEST);
    await getSessions(LATER_PAGE);

    issued(QueryKind.List).forEach((query) => expect(query.page).toMatchObject({ include_total: false }));
  });

  test('reports the period count when no filter narrows', async () => {
    stub({ totals: ok([{ sessions: 1886, cost: 654.07 }]) });

    const result = await getSessions(REQUEST);

    expect(result.response?.total).toBe(1886);
  });

  test('coerces a period count the service reported as a string', async () => {
    stub({ totals: ok([{ sessions: '212', cost: null }]) });

    const result = await getSessions(REQUEST);

    expect(result.response?.total).toBe(212);
  });

  // Under a filter the period count is not the grid's count, so offering it would overstate the result.
  // Without a total the grid finds the end by a page coming back short, which it already handles.
  test.each<[string, Partial<SessionPageRequest>]>([
    ['a search term', { search: 'acme' }],
    [
      'a column filter',
      {
        columnFilters: [{ field: SessionsField.TurnCount, operator: SessionFilterOperator.GreaterThan, value: '2' }],
      },
    ],
    ['a feedback filter', { feedback: FeedbackFilter.Rated }],
  ])('reports no total when %s narrows the period', async (_label, overrides) => {
    stub({ totals: ok([{ sessions: 1886, cost: 1 }]) });

    const result = await getSessions({ ...REQUEST, ...overrides });

    expect(result.response?.total).toBeNull();
    expect(result.response?.period?.totals?.sessions).toBe(1886);
  });

  test('issues no count query of its own under a filter', async () => {
    stub();

    await getSessions({ ...REQUEST, search: 'acme' });

    expect(issued(QueryKind.Totals)).toHaveLength(1);
  });

  test('reports no total when the period count is unavailable', async () => {
    stub({ list: ok([SESSION_ROW]), totals: failure });

    const result = await getSessions(REQUEST);

    expect(result.response?.total).toBeNull();
  });
});

describe('getSessions :: the feedback filter', () => {
  const listFilter = () => JSON.stringify(queryOf(QueryKind.List).filter);

  test('narrows the list query by a predicate on the rating enrichment counts', async () => {
    stub({ list: ok([SESSION_ROW]) });

    await getSessions({ ...REQUEST, feedback: FeedbackFilter.Positive });

    expect(listFilter()).toContain(`${RATINGS}.rate_pos_count`);
  });

  test('resolves no candidate ids and narrows by no id list', async () => {
    stub();

    await getSessions({ ...REQUEST, feedback: FeedbackFilter.Rated });

    const args = (queryOf(QueryKind.List).filter as { args: { op: QueryOperator }[] }).args;
    expect(args.some((node) => node.op === QueryOperator.In)).toBe(false);
    expect(execute().mock.calls.every(([query]) => (query as StructuredQuery).entity === 'sessions')).toBe(true);
  });

  test('a later page carries the same predicate', async () => {
    stub({ list: ok([SESSION_ROW]) });

    await getSessions({ ...LATER_PAGE, feedback: FeedbackFilter.Negative });

    expect(listFilter()).toContain(`${RATINGS}.rate_neg_count`);
  });

  test('the default feedback state adds no predicate', async () => {
    stub();

    await getSessions(REQUEST);

    expect(listFilter()).not.toContain('rate_');
  });

  test('is dropped where the schema reports no rating enrichment', async () => {
    serveSchemas({ sessions: BASE_FIELDS });
    stub();

    await getSessions({ ...REQUEST, feedback: FeedbackFilter.Positive });

    expect(listFilter()).not.toContain('rate_');
  });
});

describe('getSessions :: projection', () => {
  test('projects the source-backed fields whether or not their columns are visible', async () => {
    stub();

    await getSessions({ ...REQUEST, sourceFields: ['success_count'], visibleEnrichmentFields: [] });

    expect(JSON.stringify(queryOf(QueryKind.List).select)).toContain('success_count');
  });

  test('projects an enrichment-backed field only while its column is visible', async () => {
    stub();

    await getSessions({ ...REQUEST, visibleEnrichmentFields: ['session_insights.topic'] });
    const withColumn = JSON.stringify(queryOf(QueryKind.List).select);

    execute().mockClear();
    await getSessions({ ...REQUEST, visibleEnrichmentFields: [] });

    expect(withColumn).toContain('session_insights.topic');
    expect(JSON.stringify(queryOf(QueryKind.List).select)).not.toContain('session_insights.topic');
  });
});

describe('getSessions :: sort and column filters', () => {
  test('carries the caller sort keys into the query', async () => {
    stub({ list: ok([SESSION_ROW]) });

    await getSessions({
      ...REQUEST,
      sort: [{ field: SessionsField.TotalPrice, direction: QuerySortDirection.Desc }],
    });

    expect(queryOf(QueryKind.List).sort?.[0]).toMatchObject({
      field: SessionsField.TotalPrice,
      dir: QuerySortDirection.Desc,
    });
  });

  test('carries the column filters into the query', async () => {
    stub({ list: ok([SESSION_ROW]) });

    await getSessions({
      ...REQUEST,
      columnFilters: [{ field: SessionsField.ProjectId, operator: SessionFilterOperator.Contains, value: 'acme' }],
    });

    expect(JSON.stringify(queryOf(QueryKind.List).filter)).toContain(SessionsField.ProjectId);
  });
});

describe('getSessions :: an array column filter is resolved before the listing', () => {
  const deployments = (operator: SessionScalarOperator, value: string): SessionPageRequest['columnFilters'] => [
    { field: SessionsField.Deployments, operator, value },
  ];

  const name = (deployment: string) => ({ [UsageLogField.Deployment]: deployment });

  const predicate = () => JSON.stringify(queryOf(QueryKind.List).filter);

  test('resolves the entered text against the hop log before narrowing the listing', async () => {
    stub({ resolutions: [ok([name('gpt-4o'), name('gpt-4o-mini')])], list: ok([SESSION_ROW]) });

    await getSessions({ ...REQUEST, columnFilters: deployments(SessionFilterOperator.Contains, 'gpt') });

    const resolution = queryOf(QueryKind.Resolution);
    expect(resolution.entity).toBe(USAGE_LOG_ENTITY);
    expect(resolution.group_by).toEqual([UsageLogField.Deployment]);
    expect(JSON.stringify(resolution.filter)).toContain('gpt');

    expect(predicate()).toContain('array_has_any');
    expect(predicate()).toContain('gpt-4o-mini');
  });

  test('the resolution is issued with the caller token', async () => {
    stub({ resolutions: [ok([name('gpt-4o')])] });

    await getSessions({ ...REQUEST, columnFilters: deployments(SessionFilterOperator.Contains, 'gpt') });

    expect(execute()).toHaveBeenCalledWith(expect.objectContaining({ entity: USAGE_LOG_ENTITY }), TOKEN_MOCK);
  });

  test('an equals filter skips the resolution entirely', async () => {
    stub({ list: ok([SESSION_ROW]) });

    await getSessions({
      ...REQUEST,
      columnFilters: deployments(SessionFilterOperator.Equals, 'gpt-4o'),
    });

    expect(issued(QueryKind.Resolution)).toHaveLength(0);
    expect(predicate()).toContain('array_has');
    expect(predicate()).toContain('gpt-4o');
  });

  // The set must not be truncated, and the service caps a single read.
  test('pages the resolution until a page comes back short', async () => {
    const full = ok(Array.from({ length: ARRAY_VALUE_PAGE_SIZE }, (_, index) => name(`d${index}`)));
    stub({ resolutions: [full, ok([name('tail')])], list: ok([SESSION_ROW]) });

    await getSessions({ ...REQUEST, columnFilters: deployments(SessionFilterOperator.Contains, 'd') });

    const offsets = issued(QueryKind.Resolution).map((query) => (query.page as QueryOffsetPage).offset);
    expect(offsets).toEqual([0, ARRAY_VALUE_PAGE_SIZE]);
    expect(predicate()).toContain('tail');
  });

  test('a single short page ends the walk', async () => {
    stub({ resolutions: [ok([name('gpt-4o')])] });

    await getSessions({ ...REQUEST, columnFilters: deployments(SessionFilterOperator.Contains, 'gpt') });

    expect(issued(QueryKind.Resolution)).toHaveLength(1);
  });

  // No value matched the text, so no session does — and the filter is still stated rather than dropped.
  test('text matching no value narrows the result to nothing', async () => {
    stub({ resolutions: [ok([])], list: ok([]) });

    await getSessions({ ...REQUEST, columnFilters: deployments(SessionFilterOperator.Contains, 'nope') });

    expect(predicate()).toContain('array_length');
    expect(predicate()).not.toContain('array_has');
  });

  // Dropping it would widen the result past what the header states: the operator would read sessions
  // their filter excludes as matches.
  test('a failed resolution fails the page rather than dropping the filter', async () => {
    stub({ resolutions: [failure] });

    const result = await getSessions({
      ...REQUEST,
      columnFilters: deployments(SessionFilterOperator.Contains, 'gpt'),
    });

    expect(result.success).toBe(false);
    expect(issued(QueryKind.List)).toHaveLength(0);
  });

  test('the first page returns the resolved sets for later pages to carry', async () => {
    stub({ resolutions: [ok([name('gpt-4o')])], list: ok([SESSION_ROW]) });

    const result = await getSessions({
      ...REQUEST,
      columnFilters: deployments(SessionFilterOperator.Contains, 'gpt'),
    });

    expect(result.response?.arrayFilters).toEqual([
      { field: SessionsField.Deployments, operator: SessionFilterOperator.Contains, values: ['gpt-4o'] },
    ]);
  });

  // Resolving again per scroll block would let a later page be narrowed by a different set than the first,
  // and rows would duplicate or vanish across the scroll.
  test('a later page reuses the carried sets instead of resolving again', async () => {
    stub({ list: ok([SESSION_ROW]) });

    await getSessions({
      ...LATER_PAGE,
      columnFilters: deployments(SessionFilterOperator.Contains, 'gpt'),
      arrayFilters: [
        {
          field: SessionsField.Deployments,
          operator: SessionFilterOperator.Contains,
          values: ['carried-name'],
        },
      ],
    });

    expect(issued(QueryKind.Resolution)).toHaveLength(0);
    expect(predicate()).toContain('carried-name');
  });
});

describe('getSessionFieldValues', () => {
  const REQUEST_FOR = (overrides: Partial<SessionFieldValuesRequest> = {}): SessionFieldValuesRequest => ({
    ...FILTERS,
    field: SessionsField.InsightSentiment,
    ...overrides,
  });

  const valueRow = (value: string | null, count: number | string) => ({
    [SessionsField.InsightSentiment]: value,
    [SESSION_FIELD_VALUE_COUNT_ALIAS]: count,
  });

  test('groups the column and returns each value with its count', async () => {
    stub({ fieldValues: ok([valueRow('positive', 920), valueRow('negative', 41)]) });

    const result = await getSessionFieldValues(REQUEST_FOR());

    expect(queryOf(QueryKind.FieldValues).group_by).toEqual([SessionsField.InsightSentiment]);
    expect(result.response).toEqual([
      { value: 'positive', count: 920 },
      { value: 'negative', count: 41 },
    ]);
  });

  test('coerces a count the service returned as a string', async () => {
    stub({ fieldValues: ok([valueRow('positive', '920')]) });

    const result = await getSessionFieldValues(REQUEST_FOR());

    expect(result.response).toEqual([{ value: 'positive', count: 920 }]);
  });

  // Null on an enrichment-backed field means the enrichment has not reached that session — a statement
  // about coverage rather than one of the enum's values.
  test('drops the group with no value', async () => {
    stub({ fieldValues: ok([valueRow('positive', 920), valueRow(null, 4000), valueRow('', 3)]) });

    const result = await getSessionFieldValues(REQUEST_FOR());

    expect(result.response).toEqual([{ value: 'positive', count: 920 }]);
  });

  test('carries the resolved array sets rather than resolving its own', async () => {
    stub({ fieldValues: ok([valueRow('positive', 1)]) });

    await getSessionFieldValues(
      REQUEST_FOR({
        columnFilters: [{ field: SessionsField.Deployments, operator: SessionFilterOperator.Contains, value: 'gpt' }],
        arrayFilters: [
          {
            field: SessionsField.Deployments,
            operator: SessionFilterOperator.Contains,
            values: ['carried-name'],
          },
        ],
      }),
    );

    expect(issued(QueryKind.Resolution)).toHaveLength(0);
    expect(JSON.stringify(queryOf(QueryKind.FieldValues).filter)).toContain('carried-name');
  });

  test('carries the feedback predicate on the rating enrichment', async () => {
    stub({ fieldValues: ok([valueRow('positive', 1)]) });

    await getSessionFieldValues(REQUEST_FOR({ feedback: FeedbackFilter.Rated }));

    expect(JSON.stringify(queryOf(QueryKind.FieldValues).filter)).toContain(`${RATINGS}.rate_pos_count`);
  });

  test('reads the values under the field the role is bound to on a custom source', async () => {
    bindSource(CUSTOM_SETTING);
    serveSchemas({ agent_runs: CUSTOM_SCHEMA });
    stub({ fieldValues: ok([{ steps: '4', [SESSION_FIELD_VALUE_COUNT_ALIAS]: 2 }]) });

    const result = await getSessionFieldValues(REQUEST_FOR({ field: SessionsField.TurnCount }));

    expect(queryOf(QueryKind.FieldValues)).toMatchObject({ entity: 'agent_runs', group_by: ['steps'] });
    expect(result.response).toEqual([{ value: '4', count: 2 }]);
  });

  test('fails without a query when a required role does not resolve', async () => {
    bindSource({
      baseTable: 'agent_runs',
      roles: { [SessionsRole.SessionId]: 'gone', [SessionsRole.Time]: 'ended_at' },
    });
    serveSchemas({ agent_runs: CUSTOM_SCHEMA });

    const result = await getSessionFieldValues(REQUEST_FOR());

    expect(result).toEqual({ success: false, errorMessage: `${SessionsRole.SessionId}: gone` });
    expect(execute()).not.toHaveBeenCalled();
  });

  test('reports a failed read rather than an empty value list', async () => {
    stub({ fieldValues: failure });

    const result = await getSessionFieldValues(REQUEST_FOR());

    expect(result.success).toBe(false);
    expect(result.response).toBeUndefined();
  });
});

describe('getSessionsSchema', () => {
  test('reads the sessions entity schema with the caller token', async () => {
    getEntitySchema().mockResolvedValue({
      success: true,
      response: { fields: [{ name: 'success_count', type: 'integer', source: 'success_count' }] },
    });

    const result = await getSessionsSchema();

    expect(getEntitySchema()).toHaveBeenCalledWith('sessions', TOKEN_MOCK);
    expect(result.success).toBe(true);
    expect(result.response?.fields).toHaveLength(1);
  });

  test('reports a failure so the view can say the additional columns are unavailable', async () => {
    getEntitySchema().mockResolvedValue({ success: false, status: 500 });

    const result = await getSessionsSchema();

    expect(result.success).toBe(false);
    expect(result.response).toBeUndefined();
  });

  test('serves a repeated load from the cache rather than querying again', async () => {
    getEntitySchema().mockResolvedValue({ success: true, response: { fields: [] } });

    await getSessionsSchema();
    const result = await getSessionsSchema();

    expect(getEntitySchema()).toHaveBeenCalledOnce();
    expect(result.success).toBe(true);
  });

  test('reads the schema of the bound base table', async () => {
    bindSource(CUSTOM_SETTING);
    serveSchemas({ agent_runs: CUSTOM_SCHEMA });

    const result = await getSessionsSchema();

    expect(getEntitySchema()).toHaveBeenCalledWith('agent_runs', TOKEN_MOCK);
    expect(result.response?.fields).toEqual(CUSTOM_SCHEMA);
  });

  test('reports a schema read that throws as a failure', async () => {
    getEntitySchema().mockRejectedValue(new Error('down'));

    expect(await getSessionsSchema()).toEqual({ success: false });
  });
});

describe('getEnrichmentDefinitions', () => {
  const getTable = () => analyticsDataApi.getTable as unknown as ReturnType<typeof vi.fn>;

  test('reads each namespace table definition and returns its tag order and description', async () => {
    getTable().mockImplementation((name: string) =>
      Promise.resolve({ success: true, response: { tag_order: [`${name}-tag`], description: `${name} notes` } }),
    );

    const definitions = await getEnrichmentDefinitions(['session_insights', RATINGS]);

    expect(getTable()).toHaveBeenCalledWith('session_insights', TOKEN_MOCK);
    expect(definitions).toEqual({
      session_insights: { tagOrder: ['session_insights-tag'], description: 'session_insights notes' },
      [RATINGS]: { tagOrder: [`${RATINGS}-tag`], description: `${RATINGS} notes` },
    });
  });

  test('omits the description of a table that carries none', async () => {
    getTable().mockResolvedValueOnce({ success: true, response: { tag_order: ['insight'], description: '' } });

    expect(await getEnrichmentDefinitions(['a'])).toEqual({ a: { tagOrder: ['insight'] } });
  });

  test('costs an unreadable table its definition rather than the result', async () => {
    getTable().mockRejectedValueOnce(new Error('down')).mockResolvedValueOnce({ success: false });

    expect(await getEnrichmentDefinitions(['a', 'b'])).toEqual({ a: { tagOrder: [] }, b: { tagOrder: [] } });
  });
});

describe('the hop inspector reads', () => {
  const READABLE = [UsageLogField.RequestBody, UsageLogField.ResponseBody];

  const schemaOf = (names: string[]) =>
    getEntitySchema().mockResolvedValue({
      success: true,
      response: { fields: names.map((name) => ({ name, type: 'string', source: name })) },
    });

  const bodyRow = (overrides: Record<string, unknown> = {}) => ({
    trace_id: 'tr1',
    event_kind: 'llm_call',
    request_uri: '/openai/deployments/gpt/chat/completions',
    request_body: JSON.stringify({
      temperature: 0,
      messages: [
        { role: 'system', content: 'you are a quartermaster' },
        { role: 'user', content: 'the prompt' },
      ],
    }),
    response_body: JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: 'the answer' } }] }),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    clearEntitySchemaCache();
    (getUserToken as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
  });

  const readRequest = (requestTime: number | string | null = 1787052797216) =>
    getSessionHopRequest('tr1', 'sp1', requestTime);

  // Tier 1: roles, positions, sizes and clamped texts cross to the browser; the body does not.
  test('ships an envelope and no raw body', async () => {
    schemaOf(READABLE);
    execute().mockResolvedValue({ success: true, response: { rows: [bodyRow()] } });

    const result = await readRequest();

    expect(result.response?.state).toBe(HopReadState.Available);
    expect(result.response?.messages.map(({ role }) => role)).toEqual([MessageRole.System, MessageRole.User]);
    expect(JSON.stringify(result.response)).not.toContain('choices');
  });

  // The rule this change reverses: the system prompt is what a reader opening a hop to debug it is asking
  // about, and every message is labelled with its own role so nothing reads as something a person typed.
  test('states the system message rather than withholding it', async () => {
    schemaOf(READABLE);
    execute().mockResolvedValue({ success: true, response: { rows: [bodyRow()] } });

    const [system] = (await readRequest()).response?.messages ?? [];

    expect(system.role).toBe(MessageRole.System);
    expect(system.text).toBe('you are a quartermaster');
  });

  test('states a zero temperature rather than reporting it absent', async () => {
    schemaOf(READABLE);
    execute().mockResolvedValue({ success: true, response: { rows: [bodyRow()] } });

    const params = (await readRequest()).response?.params.stated ?? [];

    expect(params.find(({ name }) => name === 'temperature')?.value).toBe('0');
  });

  // A dialect no parser claims is answered with the raw body rather than with a wrong message list.
  test('reports an unparseable dialect as unstructured', async () => {
    schemaOf(READABLE);
    // `/v1/completions` rather than `/v1/responses`: the latter has a parser now, and this scenario is about
    // an endpoint no parser claims.
    execute().mockResolvedValue({ success: true, response: { rows: [bodyRow({ request_uri: '/v1/completions' })] } });

    expect((await readRequest()).response?.state).toBe(HopReadState.Unstructured);
  });

  // One hop at a time: the query names the hop, and the bound is its own instant.
  test('reads exactly the one hop it was asked for', async () => {
    schemaOf(READABLE);
    execute().mockResolvedValue({ success: true, response: { rows: [bodyRow()] } });

    await readRequest();

    const query = execute().mock.calls[0][0] as StructuredQuery;
    expect(JSON.stringify(query.filter)).toContain('sp1');
    expect(JSON.stringify(query.filter)).toContain('1787052797216');
    expect(execute()).toHaveBeenCalledOnce();
    expect(execute()).toHaveBeenCalledWith(expect.anything(), TOKEN_MOCK);
  });

  // Entitlement is per side: a caller holding the request column must not have the response column named in
  // their query, because an unknown field rejects the whole read.
  test('names only the body column the caller holds', async () => {
    schemaOf([UsageLogField.RequestBody]);
    execute().mockResolvedValue({ success: true, response: { rows: [bodyRow()] } });

    await readRequest();

    const query = execute().mock.calls[0][0] as StructuredQuery;
    expect(JSON.stringify(query.select)).toContain(UsageLogField.RequestBody);
    expect(JSON.stringify(query.select)).not.toContain(UsageLogField.ResponseBody);
  });

  test('a side the caller does not hold is withheld without reading anything', async () => {
    schemaOf([UsageLogField.RequestBody]);

    const result = await getSessionHopResponse('tr1', 'sp1', 1);

    expect(result.success).toBe(true);
    expect(result.response?.state).toBe(HopReadState.ColumnWithheld);
    expect(execute()).not.toHaveBeenCalled();
  });

  // A schema that could not be read is an outage, not a column that was withheld.
  test('reports a failure when the schema could not be read', async () => {
    getEntitySchema().mockResolvedValue({ success: false, status: 500 });

    const result = await readRequest();

    expect(result.success).toBe(false);
    expect(result.response?.state).toBe(HopReadState.LoadFailed);
  });

  test('reports a failed read as a failure rather than as an empty hop', async () => {
    schemaOf(READABLE);
    execute().mockResolvedValue({ success: false, response: undefined });

    expect((await readRequest()).response?.state).toBe(HopReadState.LoadFailed);
  });

  test('reports a hop the read matched no row for', async () => {
    schemaOf(READABLE);
    execute().mockResolvedValue({ success: true, response: { rows: [] } });

    const result = await readRequest();

    expect(result.success).toBe(true);
    expect(result.response?.state).toBe(HopReadState.NoBody);
  });

  test('reports a request that recorded no messages as empty', async () => {
    schemaOf(READABLE);
    execute().mockResolvedValue({ success: true, response: { rows: [bodyRow({ request_body: null })] } });

    expect((await readRequest()).response?.state).toBe(HopReadState.NoBody);
  });

  // Tier 2 returns one message in full and nothing beside it — not the whole body, and not a neighbouring
  // message's text alongside.
  test('returns a single message in full', async () => {
    schemaOf(READABLE);
    execute().mockResolvedValue({ success: true, response: { rows: [bodyRow()] } });

    const result = await getSessionHopMessage('tr1', 'sp1', 1, 1);

    expect(result.response?.text).toBe('the prompt');
    expect(JSON.stringify(result.response)).not.toContain('quartermaster');
  });

  test('reports an index the body does not carry rather than throwing', async () => {
    schemaOf(READABLE);
    execute().mockResolvedValue({ success: true, response: { rows: [bodyRow()] } });

    expect((await getSessionHopMessage('tr1', 'sp1', 1, 9)).response?.state).toBe(HopReadState.NoBody);
  });

  // An assistant message that only called a tool: the call is what it said, so tier 2 carries it.
  test('returns an assistant call as the message content', async () => {
    schemaOf(READABLE);
    const withCall = JSON.stringify({
      messages: [
        { role: 'assistant', content: '', tool_calls: [{ function: { name: 'calc', arguments: '{"a":1}' } }] },
      ],
    });
    execute().mockResolvedValue({ success: true, response: { rows: [bodyRow({ request_body: withCall })] } });

    const result = await getSessionHopMessage('tr1', 'sp1', 1, 0);

    // The tier-2 read of one message carries the call's id for the same reason the envelope does.
    expect(result.response?.toolCalls).toEqual([{ name: 'calc', args: '{"a":1}', id: null }]);
  });

  // Tier 3 clamps and states both sizes: silent truncation produces a reader who believes they read it all.
  test('clamps the raw body and states what was withheld', async () => {
    schemaOf(READABLE);
    const huge = 'x'.repeat(RAW_BODY_BYTE_BUDGET + 50);
    execute().mockResolvedValue({ success: true, response: { rows: [bodyRow({ request_body: huge })] } });

    const result = await getSessionHopRawBody('tr1', 'sp1', 1, HopInspectorSide.Request);

    expect(result.response?.clamp).toEqual({
      isClamped: true,
      recordedBytes: RAW_BODY_BYTE_BUDGET + 50,
      deliveredBytes: RAW_BODY_BYTE_BUDGET,
    });
  });

  test('states the assembled response and its finish reason', async () => {
    schemaOf(READABLE);
    execute().mockResolvedValue({ success: true, response: { rows: [bodyRow()] } });

    const result = await getSessionHopResponse('tr1', 'sp1', 1);

    expect(result.response?.text).toBe('the answer');
    expect(result.response?.finishReason).toBe('stop');
  });

  test('sends no time bound for a hop that records no time', async () => {
    schemaOf(READABLE);
    execute().mockResolvedValue({ success: true, response: { rows: [bodyRow()] } });

    await readRequest(null);

    const query = execute().mock.calls[0][0] as StructuredQuery;
    // Matched as an operator rather than as a substring: the identity enrichment's column name contains
    // "ge" (usa*ge*_client_identity), so a bare `toContain` passes for the wrong reason.
    expect(JSON.stringify(query.filter)).not.toContain(`"op":"${QueryOperator.Ge}"`);
  });

  describe('the rebuilt request body', () => {
    const payload = (name: UsageLogField) => `dial_usage_log_payload.${name}`;
    const REBUILT_SCHEMA = [
      payload(UsageLogField.RequestBody),
      payload(UsageLogField.RequestBodyFull),
      payload(UsageLogField.RequestBodyRebuild),
      payload(UsageLogField.ResponseBody),
    ];
    const WHOLE = JSON.stringify({
      tools: [{ type: 'function', function: { name: 'calc' } }],
      messages: [
        { role: 'system', content: 'you are a quartermaster' },
        { role: 'user', content: 'the first prompt' },
        { role: 'assistant', content: 'the first answer' },
        { role: 'user', content: 'the second prompt' },
      ],
    });
    const DELTA = JSON.stringify({ messages: [{ role: 'user', content: 'the second prompt' }] });

    const rebuiltRow = (status: string | null, full: string | null = WHOLE) => ({
      trace_id: 'tr1',
      request_uri: '/openai/deployments/gpt/chat/completions',
      [payload(UsageLogField.RequestBody)]: DELTA,
      [payload(UsageLogField.RequestBodyFull)]: full,
      [payload(UsageLogField.RequestBodyRebuild)]: status,
    });

    const selectOf = () => JSON.stringify((execute().mock.calls[0][0] as StructuredQuery).select);

    test('selects the rebuilt body and its status instead of the stored body', async () => {
      schemaOf(REBUILT_SCHEMA);
      execute().mockResolvedValue({ success: true, response: { rows: [rebuiltRow('rebuilt')] } });

      await readRequest();

      expect(selectOf()).toContain(payload(UsageLogField.RequestBodyFull));
      expect(selectOf()).toContain(payload(UsageLogField.RequestBodyRebuild));
      expect(selectOf()).not.toContain(`"${payload(UsageLogField.RequestBody)}"`);
    });

    test('names neither new column where the schema does not report them', async () => {
      schemaOf(READABLE);
      execute().mockResolvedValue({ success: true, response: { rows: [bodyRow()] } });

      await readRequest();

      expect(selectOf()).not.toContain(UsageLogField.RequestBodyFull);
      expect(selectOf()).not.toContain(UsageLogField.RequestBodyRebuild);
    });

    test('decodes the whole request from the rebuilt body', async () => {
      schemaOf(REBUILT_SCHEMA);
      execute().mockResolvedValue({ success: true, response: { rows: [rebuiltRow('rebuilt')] } });

      const result = await readRequest();

      expect(result.response?.messages.map(({ role }) => role)).toEqual([
        MessageRole.System,
        MessageRole.User,
        MessageRole.Assistant,
        MessageRole.User,
      ]);
      expect(result.response?.isPartial).toBe(false);
    });

    test('numbers the message it returns in full the way the envelope numbered it', async () => {
      schemaOf(REBUILT_SCHEMA);
      execute().mockResolvedValue({ success: true, response: { rows: [rebuiltRow('rebuilt')] } });

      const envelope = await readRequest();
      const message = await getSessionHopMessage('tr1', 'sp1', 1, 3);

      expect(envelope.response?.messages[3].text).toBe('the second prompt');
      expect(message.response?.text).toBe('the second prompt');
    });

    test('marks a partially rebuilt request and still returns its messages', async () => {
      schemaOf(REBUILT_SCHEMA);
      execute().mockResolvedValue({ success: true, response: { rows: [rebuiltRow('partial', DELTA)] } });

      const result = await readRequest();

      expect(result.success).toBe(true);
      expect(result.response?.state).toBe(HopReadState.Available);
      expect(result.response?.isPartial).toBe(true);
      expect(result.response?.messages).toHaveLength(1);
    });

    test('marks the raw view of a partially rebuilt request', async () => {
      schemaOf(REBUILT_SCHEMA);
      execute().mockResolvedValue({ success: true, response: { rows: [rebuiltRow('partial', DELTA)] } });

      const result = await getSessionHopRawBody('tr1', 'sp1', 1, HopInspectorSide.Request);

      expect(result.response?.text).toBe(DELTA);
      expect(result.response?.isPartial).toBe(true);
    });

    test.each(['stored', 'rebuilt', 'resolvable', null])(
      'does not mark a request whose status is %s',
      async (status) => {
        schemaOf(REBUILT_SCHEMA);
        execute().mockResolvedValue({ success: true, response: { rows: [rebuiltRow(status)] } });

        expect((await readRequest()).response?.isPartial).toBe(false);
      },
    );

    test('resolves a row with no stored body as a request that recorded nothing', async () => {
      schemaOf(REBUILT_SCHEMA);
      execute().mockResolvedValue({ success: true, response: { rows: [rebuiltRow(null, null)] } });

      expect((await readRequest()).response?.state).toBe(HopReadState.NoBody);
    });
  });
});

describe('getEntityTracePage', () => {
  const CALL = { trace_id: 't1', core_span_id: 's1', request_time: END_MS - 1000, deployment: 'a-model' };
  const FIGURE = { trace_id: 't1', event_kind: 'llm_call', spans: 3, tokens: 10, price: 0.1, failed_spans: 0 };

  test('reads the calls, then the figures of their traces, with the token', async () => {
    execute()
      .mockResolvedValueOnce(ok([CALL]))
      .mockResolvedValueOnce(ok([FIGURE]));

    const result = await getEntityTracePage(ApplicationRoute.Models, 'a-model', END_MS - DAY_MS, END_MS, null);

    expect(execute()).toHaveBeenCalledTimes(2);
    expect(execute()).toHaveBeenNthCalledWith(1, expect.objectContaining({ entity: 'dial_usage_log' }), TOKEN_MOCK);
    expect(result.response?.groups).toEqual([
      expect.objectContaining({ traceId: 't1', spans: 3, cards: [expect.objectContaining({ coreSpanId: 's1' })] }),
    ]);
    expect(result.response?.cursor).toEqual({ requestTime: END_MS - 1000, coreSpanId: 's1' });
    expect(result.response?.hasMore).toBe(false);
  });

  test('reads nothing for an entity with no name to match', async () => {
    const result = await getEntityTracePage(ApplicationRoute.Models, null, END_MS - DAY_MS, END_MS, null);

    expect(execute()).not.toHaveBeenCalled();
    expect(result.response).toEqual({ groups: [], hasMore: false, cursor: null });
  });

  test('issues no figures read for an empty page', async () => {
    execute().mockResolvedValueOnce(ok([]));

    const result = await getEntityTracePage(ApplicationRoute.Models, 'a-model', END_MS - DAY_MS, END_MS, null);

    expect(execute()).toHaveBeenCalledOnce();
    expect(result.response?.groups).toEqual([]);
  });

  test('passes a refusal through with its status', async () => {
    execute().mockResolvedValueOnce({ success: false, status: 403 });

    const result = await getEntityTracePage(ApplicationRoute.Models, 'a-model', END_MS - DAY_MS, END_MS, null);

    expect(result).toEqual(expect.objectContaining({ success: false, status: 403 }));
  });

  test('fails the page when the figures read fails', async () => {
    execute()
      .mockResolvedValueOnce(ok([CALL]))
      .mockResolvedValueOnce({ success: false });

    const result = await getEntityTracePage(ApplicationRoute.Models, 'a-model', END_MS - DAY_MS, END_MS, null);

    expect(result.success).toBe(false);
  });
});

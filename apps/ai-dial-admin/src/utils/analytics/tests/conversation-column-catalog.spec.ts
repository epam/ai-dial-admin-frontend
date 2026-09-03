import { ColDef } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import { CONVERSATIONS_TRACE_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import {
  ColumnProvenance,
  ConversationColumn,
  ConversationsField,
  ProvenanceEntity,
  UsageLogField,
} from '@/src/models/analytics/conversations-trace';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryValueType } from '@/src/models/analytics/query';
import {
  availableSelectFields,
  catalogValueTypes,
  columnProvenance,
  composedSourceEntities,
  conversationColumnGroups,
  filterableColumnFields,
  offerableSchemaFields,
  projectableSchemaFields,
  sortableColumnFields,
  hopBodyFields,
} from '@/src/utils/analytics/conversation-column-catalog';
import {
  CONVERSATION_VALUE_FILTER,
  CONVERSATION_VALUE_FLOATING_FILTER,
  OPTIONAL_USAGE_LOG_FIELDS,
} from '@/src/constants/analytics/conversations-trace';

const t = (key: string) => key;

// A plain column of the entity's own table reports its flat name as its source; an enrichment column's name
// is namespaced while its source stays bare. That inequality is the whole test for "needs a join".
const sourceField = (name: string, overrides: Partial<AnalyticsEntityField> = {}): AnalyticsEntityField => ({
  name,
  source: name,
  type: AnalyticsFieldType.String,
  ...overrides,
});

const enrichmentField = (
  name: string,
  overrides: Partial<AnalyticsEntityField> = {},
  enrichment = 'session_insights',
): AnalyticsEntityField => ({
  name: `${enrichment}.${name}`,
  source: name,
  type: AnalyticsFieldType.String,
  ...overrides,
});

// Shaped after the live dev entity: its tags, `display_name` on some fields only, `heavy` on its one array
// field, and the five bookkeeping fields tagged `provenance`.
const SCHEMA: AnalyticsEntityField[] = [
  sourceField('client_session_id', { tag: 'identity' }),
  sourceField('project_id', { tag: 'principal' }),
  sourceField('user_hash', { tag: 'principal' }),
  sourceField('turn_count', { type: AnalyticsFieldType.Long, tag: 'response' }),
  sourceField('success_count', { type: AnalyticsFieldType.Long, tag: 'response' }),
  sourceField('first_request_time', { type: AnalyticsFieldType.Timestamp, tag: 'identity' }),
  sourceField('last_request_time', { type: AnalyticsFieldType.Timestamp, tag: 'identity' }),
  sourceField('total_tokens', { type: AnalyticsFieldType.Long, tag: 'token-usage' }),
  sourceField('reasoning_tokens', {
    type: AnalyticsFieldType.Long,
    tag: 'token-usage',
    display_name: 'Reasoning tokens',
  }),
  sourceField('total_price', { type: AnalyticsFieldType.Decimal, tag: 'cost' }),
  sourceField('chain_price_total', {
    type: AnalyticsFieldType.Decimal,
    tag: 'cost',
    display_name: 'Chain cost (top-down)',
    description: 'Conversation cost summed top-down. That is a coverage gap, not an accounting difference.',
  }),
  sourceField('duration_ms', {
    type: AnalyticsFieldType.Long,
    tag: 'performance',
    description: "A hop's duration contains the durations of the hops it called.",
  }),
  sourceField('avg_duration_ms', { type: AnalyticsFieldType.Decimal, tag: 'performance' }),
  sourceField('deployments', {
    type: AnalyticsFieldType.Array,
    tag: 'deployment',
    display_name: 'Deployments',
  }),
  sourceField('traces', {
    type: AnalyticsFieldType.Array,
    tag: 'identity',
    display_name: 'Trace IDs',
    heavy: true,
  }),
  enrichmentField('title', { tag: 'insight', display_name: 'Title' }),
  enrichmentField('summary', { tag: 'insight', display_name: 'Summary' }),
  enrichmentField('topics', { tag: 'insight', display_name: 'Topics' }),
  enrichmentField('sentiment', { tag: 'insight', display_name: 'Sentiment' }),
  enrichmentField('sentiment_score', { type: AnalyticsFieldType.Decimal, tag: 'insight' }),
  enrichmentField('resolution_status', { tag: 'insight', display_name: 'Resolution status' }),
  enrichmentField('model', {
    tag: 'provenance',
    display_name: 'Model',
    description: 'DIAL deployment that produced this row.',
  }),
  enrichmentField('evaluator_version', { type: AnalyticsFieldType.Integer, tag: 'provenance' }),
  enrichmentField('enriched_at', { type: AnalyticsFieldType.Timestamp, tag: 'provenance' }),
  enrichmentField('truncated', { type: AnalyticsFieldType.Boolean, tag: 'provenance' }),
];

const columns = (schemaFields: AnalyticsEntityField[] = SCHEMA): ColDef[] =>
  CONVERSATIONS_TRACE_COLUMNS(t, schemaFields);

const fieldsOf = (defs: ColDef[]): string[] => defs.map((column) => column.field as string);

// Asserted through the rendered column set rather than the offer helper, which is what the grid shows.
describe('CONVERSATIONS_TRACE_COLUMNS', () => {
  test('offers every field the schema reports that no curated column already reads', () => {
    const offered = fieldsOf(columns());

    expect(offered).toContain('success_count');
    expect(offered).toContain('duration_ms');
    expect(offered).toContain('chain_price_total');
    expect(offered).toContain('session_insights.sentiment');
    expect(offered).toContain('session_insights.resolution_status');
  });

  // Asserting a number here would put back the fixed list the schema is read to avoid.
  test('offers a count that follows the schema rather than a fixed set', () => {
    const larger = [...SCHEMA, sourceField('extra_metric', { type: AnalyticsFieldType.Long, tag: 'cost' })];

    expect(fieldsOf(columns(larger)).length).toBe(fieldsOf(columns()).length + 1);
  });

  test('offers a field of an enrichment this frontend has never heard of', () => {
    const withBuckets = [...SCHEMA, enrichmentField('bucket', { tag: 'cost' }, 'conversation_buckets')];

    expect(fieldsOf(columns(withBuckets))).toContain('conversation_buckets.bucket');
  });

  test('withholds a sensitive field, which the caller would be refused', () => {
    const withSensitive = [...SCHEMA, sourceField('secret', { sensitive: true })];

    expect(fieldsOf(columns(withSensitive))).not.toContain('secret');
  });

  // The array test governs derivation into a column, not projection: `deployments` is an array too and is
  // projected normally. `traces` is simply never derived, so nothing rendered reads it.
  test('withholds a non-scalar field, whose shape the grid does not know', () => {
    expect(fieldsOf(columns())).not.toContain(ConversationsField.Traces);
  });

  test('offers a scalar heavy field rather than withholding it for being heavy', () => {
    const withHeavyScalar = [...SCHEMA, sourceField('big_blob', { tag: 'response', heavy: true })];

    expect(fieldsOf(columns(withHeavyScalar))).toContain('big_blob');
  });

  test('offers a field a curated column already reads only once', () => {
    const offered = fieldsOf(columns());

    expect(offered.filter((name) => name === ConversationsField.Deployments)).toHaveLength(1);
    expect(offered.filter((name) => name === ConversationsField.InsightTopics)).toHaveLength(1);
    expect(offered).not.toContain(ConversationsField.FirstRequestTime);
    expect(offered).not.toContain(ConversationsField.InsightTitle);
  });

  test('offers only the curated columns without a schema, since no field can be confirmed to exist', () => {
    expect(offerableSchemaFields(columns([]), [])).toEqual([]);
    expect(fieldsOf(columns([]))).not.toContain('duration_ms');
  });
});

describe('columnProvenance', () => {
  test('attributes an unqualified name to the rollup', () => {
    expect(columnProvenance(ConversationsField.TotalPrice)).toBe(ColumnProvenance.Conversations);
  });

  test('attributes a qualified name to the enrichment that supplies it', () => {
    expect(columnProvenance(ConversationsField.InsightTopics)).toBe(ColumnProvenance.Insights);
  });

  test('attributes an unknown enrichment to neither the rollup nor a named origin', () => {
    expect(columnProvenance('conversation_buckets.bucket')).toBe(ColumnProvenance.Other);
  });

  test('attributes the composed rating column to the feedback source', () => {
    expect(columnProvenance(ConversationColumn.Rating)).toBe(ColumnProvenance.Feedback);
  });
});

describe('conversationColumnGroups', () => {
  const groups = (schemaFields: AnalyticsEntityField[] = SCHEMA) =>
    conversationColumnGroups(columns(schemaFields), schemaFields);

  test('groups on the pair of origin and tag', () => {
    const identity = groups().find(
      (group) => group.provenance === ColumnProvenance.Conversations && group.tag === 'identity',
    );

    expect(identity?.fields).toContain(ConversationsField.ChatId);
    expect(identity?.fields).toContain(ConversationsField.LastRequestTime);
  });

  test('keeps a rollup field and an enrichment field sharing a tag in separate groups', () => {
    const withBuckets = [...SCHEMA, enrichmentField('bucket', { tag: 'cost' }, 'conversation_buckets')];
    const costGroups = groups(withBuckets).filter((group) => group.tag === 'cost');

    expect(costGroups).toHaveLength(2);
    expect(costGroups.map((group) => group.provenance)).toEqual([
      ColumnProvenance.Conversations,
      ColumnProvenance.Other,
    ]);
  });

  // Every unnamed enrichment shares the one `Other` origin, so without the source in the key two of them
  // carrying the same tag would merge into one group labelled after whichever came first.
  test('keeps two enrichments it cannot name in separate groups when they share a tag', () => {
    const withTwo = [
      ...SCHEMA,
      enrichmentField('cost_bucket', { tag: 'cost' }, 'conversation_buckets'),
      enrichmentField('cost_rank', { tag: 'cost' }, 'conversation_topics'),
    ];
    const unnamed = groups(withTwo).filter((group) => group.provenance === ColumnProvenance.Other);

    expect(unnamed).toHaveLength(2);
    expect(unnamed.map((group) => group.source)).toEqual(['conversation_buckets', 'conversation_topics']);
    unnamed.forEach((group) => expect(group.fields).toHaveLength(1));
  });

  test('names the enrichment supplying a group, even one it holds no label for', () => {
    const withBuckets = [...SCHEMA, enrichmentField('bucket', { tag: 'cost' }, 'conversation_buckets')];
    const unknown = groups(withBuckets).find((group) => group.provenance === ColumnProvenance.Other);

    expect(unknown?.source).toBe('conversation_buckets');
  });

  test('attributes every column to exactly one group', () => {
    const grouped = groups().flatMap((group) => group.fields);

    expect(grouped).toEqual(expect.arrayContaining(fieldsOf(columns())));
    expect(grouped).toHaveLength(fieldsOf(columns()).length);
    expect(new Set(grouped).size).toBe(grouped.length);
  });

  test('collects the evaluator bookkeeping into one group of its own', () => {
    const provenance = groups().find((group) => group.tag === 'provenance');

    expect(provenance?.provenance).toBe(ColumnProvenance.Insights);
    expect(provenance?.fields).toContain('session_insights.model');
    expect(provenance?.fields).toContain('session_insights.enriched_at');
    expect(provenance?.fields).not.toContain(ConversationsField.InsightTopics);
  });

  test('collapses to one group per origin when the schema reports no tags', () => {
    expect(groups([]).map((group) => group.provenance)).toEqual([
      ColumnProvenance.Conversations,
      ColumnProvenance.Feedback,
    ]);
  });
});

describe('projectableSchemaFields', () => {
  test('projects a cheap source field whether or not its column is visible', () => {
    const { cheapSource } = projectableSchemaFields(columns(), SCHEMA);

    expect(cheapSource).toContain(ConversationsField.ChatId);
    expect(cheapSource).toContain('duration_ms');
    expect(cheapSource).toContain(ConversationsField.FirstRequestTime);
  });

  // The one heavy field cost 2.7× the other ten columns together, so it is worth a re-fetch on reveal.
  test('separates a heavy source field, which is gated on visibility', () => {
    const withHeavyScalar = [...SCHEMA, sourceField('big_blob', { tag: 'response', heavy: true })];
    const { cheapSource, heavySource } = projectableSchemaFields(columns(withHeavyScalar), withHeavyScalar);

    expect(heavySource).toEqual(['big_blob']);
    expect(cheapSource).not.toContain('big_blob');
  });

  // Nothing rendered reads `traces`, so nothing projects it — its being heavy never comes into play. The
  // bucket fills the day a scalar field is marked heavy, or a column is added that reads `traces`.
  test('projects no field for a column the grid does not render', () => {
    const { cheapSource, heavySource } = projectableSchemaFields(columns(), SCHEMA);

    expect(heavySource).toEqual([]);
    expect(cheapSource).not.toContain(ConversationsField.Traces);
  });

  test('separates an enrichment field, whose join is paid per page', () => {
    const { enrichment, cheapSource } = projectableSchemaFields(columns(), SCHEMA);

    expect(enrichment).toContain(ConversationsField.InsightTopics);
    expect(enrichment).toContain('session_insights.sentiment');
    expect(cheapSource).not.toContain(ConversationsField.InsightTopics);
  });

  test('projects the identity column title unconditionally, with no column of its own', () => {
    const { requiredEnrichment, enrichment } = projectableSchemaFields(columns(), SCHEMA);

    expect(requiredEnrichment).toEqual([ConversationsField.InsightTitle]);
    expect(enrichment).not.toContain(ConversationsField.InsightTitle);
  });

  test('excludes the composed rating column, which reads no field of this entity', () => {
    const { cheapSource, heavySource, enrichment, requiredEnrichment } = projectableSchemaFields(columns(), SCHEMA);

    expect([...cheapSource, ...heavySource, ...enrichment, ...requiredEnrichment]).not.toContain(
      ConversationColumn.Rating,
    );
  });

  test('names nothing an instance does not report', () => {
    const withoutInsights = SCHEMA.filter((field) => !field.name.startsWith('session_insights.'));
    const { enrichment, requiredEnrichment } = projectableSchemaFields(columns(withoutInsights), withoutInsights);

    expect(enrichment).toEqual([]);
    expect(requiredEnrichment).toEqual([]);
  });

  test('projects nothing at all without a schema, since no field can be confirmed to exist', () => {
    const { cheapSource, heavySource, enrichment, requiredEnrichment } = projectableSchemaFields(columns([]), []);

    expect([...cheapSource, ...heavySource, ...enrichment, ...requiredEnrichment]).toEqual([]);
  });
});

describe('catalogValueTypes', () => {
  test('maps a reported field type to the value type the query language carries', () => {
    const types = catalogValueTypes(SCHEMA);

    expect(types['duration_ms']).toBe(QueryValueType.Long);
    expect(types['chain_price_total']).toBe(QueryValueType.Decimal);
    expect(types['session_insights.enriched_at']).toBe(QueryValueType.Timestamp);
    expect(types['session_insights.truncated']).toBe(QueryValueType.Boolean);
  });

  test('keeps the curated value types where the schema adds nothing', () => {
    expect(catalogValueTypes([])[ConversationsField.TotalPrice]).toBe(QueryValueType.Decimal);
  });
});

// Both lists derive from the column set, which has already dropped any column whose field the instance does
// not report, so the schema gate is structural rather than a second list to keep in step.
describe('sortableColumnFields / filterableColumnFields', () => {
  test('offer a derived scalar column and withhold the arrays', () => {
    expect(sortableColumnFields(columns())).toContain('duration_ms');
    expect(sortableColumnFields(columns())).toContain('session_insights.sentiment');
    expect(sortableColumnFields(columns())).not.toContain(ConversationsField.Deployments);
    expect(sortableColumnFields(columns())).not.toContain(ConversationsField.InsightTopics);
  });

  test('withhold the period axis the toolbar already owns', () => {
    expect(filterableColumnFields(columns())).not.toContain(ConversationsField.LastRequestTime);
  });

  test('drop an enrichment predicate the instance cannot answer', () => {
    const withoutInsights = SCHEMA.filter((field) => !field.name.startsWith('session_insights.'));

    expect(filterableColumnFields(columns(withoutInsights))).not.toContain(ConversationsField.InsightTopics);
  });
});

// Reached by the declared type alone — nothing here names which fields are enums, which is the point.
describe('a derived column binds a filter its type can answer', () => {
  const derived = (name: string, type: AnalyticsFieldType): ColDef => {
    const catalog = columns([...SCHEMA, sourceField(name, { type })]);
    return catalog.find((column) => column.field === name) as ColDef;
  };

  // The floating row is kept so the affordance sits level with every neighbouring column's filter, but the
  // *default* floating filter is a text entry that would write a text model over the value model — so the
  // column names its own, which only opens the popup.
  test('an enum field binds the value filter and its own floating filter', () => {
    const column = derived('usage_scope', AnalyticsFieldType.Enum);

    expect(column.filter).toBe(CONVERSATION_VALUE_FILTER);
    expect(column.floatingFilterComponent).toBe(CONVERSATION_VALUE_FLOATING_FILTER);
    expect(column.floatingFilter).not.toBe(false);
    // The grid's own floating-filter button is deliberately left in place: it is the affordance, identical
    // to the one every neighbouring column has. Suppressing it makes the grid fall back to a header-row
    // icon instead, which is the misplacement this binding exists to avoid.
    expect(column.suppressFloatingFilterButton).toBeUndefined();
  });

  test('an enum column stays sortable and filterable', () => {
    const catalog = columns([...SCHEMA, sourceField('usage_scope', { type: AnalyticsFieldType.Enum })]);

    expect(sortableColumnFields(catalog)).toContain('usage_scope');
    expect(filterableColumnFields(catalog)).toContain('usage_scope');
  });

  test('an enum column resolves a string value type for its predicate', () => {
    const types = catalogValueTypes([sourceField('usage_scope', { type: AnalyticsFieldType.Enum })]);

    expect(types['usage_scope']).toBe(QueryValueType.String);
  });

  // A date column's filter model carries `dateFrom`/`dateTo`, which the translation reads nothing from; a
  // boolean would fall through to `contains`, which the query language cannot express over a boolean.
  test.each([
    ['timestamp', AnalyticsFieldType.Timestamp],
    ['boolean', AnalyticsFieldType.Boolean],
  ])('a %s field binds no filter at all', (name, type) => {
    const column = derived(`probe_${name}`, type);

    expect(column.filter).toBe(false);
    expect(column.floatingFilter).toBe(false);
  });

  test('a string field keeps the text filter', () => {
    const column = derived('probe_string', AnalyticsFieldType.String);

    expect(column.filter).toBeUndefined();
    expect(column.filterParams).toBeDefined();
  });
});

describe('availableSelectFields', () => {
  const ordered = ['chat_id', 'total_price', 'session_insights.title', 'traces'];
  const optional = ['session_insights.title', 'traces'];

  test('names an optional field only where the schema reports it', () => {
    expect(availableSelectFields(ordered, optional, ['chat_id', 'total_price', 'session_insights.title'])).toEqual([
      'chat_id',
      'total_price',
      'session_insights.title',
    ]);
  });

  test('names the required core alone when the schema could not be read', () => {
    expect(availableSelectFields(ordered, optional, undefined)).toEqual(['chat_id', 'total_price']);
  });

  test('keeps the caller ordering, since the select is read positionally', () => {
    expect(availableSelectFields(ordered, optional, ['traces', 'chat_id', 'total_price'])).toEqual([
      'chat_id',
      'total_price',
      'traces',
    ]);
  });
});

// Two unrelated conditions remove a body column from the fetched schema, and both look identical here: the
// `sensitive` flag hides all three from a caller below FULL_ADMIN, while `assembled_response` is simply not
// persisted by an instance predating it — missing for every caller, full administrators included.
describe('hopBodyFields', () => {
  const ALL = [UsageLogField.RequestBody, UsageLogField.ResponseBody, UsageLogField.AssembledResponse];

  test('reports both sides readable when the request body and both response columns are reported', () => {
    expect(hopBodyFields(ALL)).toEqual({
      isRequestReadable: true,
      isResponseReadable: true,
      responseFields: [UsageLogField.AssembledResponse, UsageLogField.ResponseBody],
    });
  });

  // The service-version case: an older instance carries no assembled column at all, and the decoder over the
  // raw body is the only path. The response side still reads.
  test('reads the response side from the raw body alone when the assembled column is absent', () => {
    expect(hopBodyFields([UsageLogField.RequestBody, UsageLogField.ResponseBody])).toEqual({
      isRequestReadable: true,
      isResponseReadable: true,
      responseFields: [UsageLogField.ResponseBody],
    });
  });

  test('prefers the assembled column when it is the only response column reported', () => {
    expect(hopBodyFields([UsageLogField.RequestBody, UsageLogField.AssembledResponse])).toEqual({
      isRequestReadable: true,
      isResponseReadable: true,
      responseFields: [UsageLogField.AssembledResponse],
    });
  });

  // The access case: `sensitive` takes all three at once, which is why the request body going missing is the
  // reliable signal that this is a rights problem rather than a version one.
  test('reports neither side readable when the schema reports none of them', () => {
    expect(hopBodyFields([UsageLogField.ChatId, UsageLogField.TraceId])).toEqual({
      isRequestReadable: false,
      isResponseReadable: false,
      responseFields: [],
    });
  });

  test('states the two sides independently, with no combined verdict', () => {
    const requestOnly = hopBodyFields([UsageLogField.RequestBody]);

    expect(requestOnly.isRequestReadable).toBe(true);
    expect(requestOnly.isResponseReadable).toBe(false);
    expect(requestOnly).not.toHaveProperty('isReadable');
  });

  test('reports the response side alone when the request body is not reported', () => {
    expect(hopBodyFields([UsageLogField.ResponseBody, UsageLogField.AssembledResponse])).toEqual({
      isRequestReadable: false,
      isResponseReadable: true,
      responseFields: [UsageLogField.AssembledResponse, UsageLogField.ResponseBody],
    });
  });

  test('reports the request side alone when no response column is reported', () => {
    expect(hopBodyFields([UsageLogField.RequestBody])).toEqual({
      isRequestReadable: true,
      isResponseReadable: false,
      responseFields: [],
    });
  });

  test('reports neither side readable from an unread schema', () => {
    expect(hopBodyFields()).toEqual({
      isRequestReadable: false,
      isResponseReadable: false,
      responseFields: [],
    });
  });
});

// The gate that protects a full administrator: naming a column the instance does not persist is a 400 on the
// whole query, and no permission changes that.
describe('the hop log optional-field list', () => {
  const ordered = [UsageLogField.TraceId, UsageLogField.RequestBody, UsageLogField.AssembledResponse];

  test('names the assembled column where the schema reports it', () => {
    expect(availableSelectFields(ordered, OPTIONAL_USAGE_LOG_FIELDS, [...ordered])).toEqual(ordered);
  });

  test('omits the assembled column where the schema does not, keeping every required field', () => {
    expect(
      availableSelectFields(ordered, OPTIONAL_USAGE_LOG_FIELDS, [UsageLogField.TraceId, UsageLogField.RequestBody]),
    ).toEqual([UsageLogField.TraceId, UsageLogField.RequestBody]);
  });

  test('names the required fields only when the schema could not be read', () => {
    expect(availableSelectFields(ordered, OPTIONAL_USAGE_LOG_FIELDS, undefined)).toEqual([
      UsageLogField.TraceId,
      UsageLogField.RequestBody,
    ]);
  });

  // An instance can persist one body column without the other, and the gate accepts either — so neither may
  // be named unconditionally. Naming `response_body` regardless broke the whole Chat view on an instance
  // that reports only the assembled column.
  test('treats both body columns as optional hop-log fields', () => {
    expect(OPTIONAL_USAGE_LOG_FIELDS).toEqual([UsageLogField.AssembledResponse, UsageLogField.ResponseBody]);
  });

  test('omits the raw response column where the schema reports only the assembled one', () => {
    const bodyFields = [UsageLogField.RequestBody, UsageLogField.ResponseBody, UsageLogField.AssembledResponse];

    expect(
      availableSelectFields(bodyFields, OPTIONAL_USAGE_LOG_FIELDS, [
        UsageLogField.RequestBody,
        UsageLogField.AssembledResponse,
      ]),
    ).toEqual([UsageLogField.RequestBody, UsageLogField.AssembledResponse]);
  });
});

describe('composedSourceEntities', () => {
  const field = (name: string): AnalyticsEntityField => ({
    name,
    type: AnalyticsFieldType.String,
    source: name.includes('.') ? name.slice(name.indexOf('.') + 1) : name,
  });

  const RATINGS: ProvenanceEntity = { name: 'response_ratings', provenance: ColumnProvenance.Feedback };

  test('names the base entity first, then each enrichment, then the queried entities', () => {
    const entities = composedSourceEntities(
      'conversations',
      [field('chat_id'), field('session_insights.title'), field('conversation_buckets.turn_bucket')],
      [RATINGS],
    );

    expect(entities.map((entity) => entity.name)).toEqual([
      'conversations',
      'session_insights',
      'conversation_buckets',
      'response_ratings',
    ]);
  });

  test('names an enrichment once however many of its fields the schema reports', () => {
    const entities = composedSourceEntities('conversations', [
      field('session_insights.title'),
      field('session_insights.summary'),
    ]);

    expect(entities.filter((entity) => entity.name === 'session_insights')).toHaveLength(1);
  });

  test('attributes an enrichment it cannot name to the unattributed provenance', () => {
    const [, unknown] = composedSourceEntities('conversations', [field('some_future_enrichment.value')]);

    expect(unknown).toEqual({ name: 'some_future_enrichment', provenance: ColumnProvenance.Other });
  });

  test('names the base entity alone when the schema reports no enrichment', () => {
    expect(composedSourceEntities('conversations', [field('chat_id')])).toEqual([
      { name: 'conversations', provenance: ColumnProvenance.Conversations },
    ]);
  });

  test('names nothing beyond the base entity when given no schema at all', () => {
    expect(composedSourceEntities('conversations')).toEqual([
      { name: 'conversations', provenance: ColumnProvenance.Conversations },
    ]);
  });

  // The day ratings arrive as an enrichment, the schema reports the namespace while the queried list still
  // names the table. The declared attribution has to win: the derived one falls back to the unattributed
  // colour, which would paint the line grey while the grid band paints the same source as feedback.
  test('names an entity once, keeping the declared attribution over the derived fallback', () => {
    const entities = composedSourceEntities('conversations', [field('response_ratings.rate_pos_count')], [RATINGS]);

    expect(entities).toEqual([{ name: 'conversations', provenance: ColumnProvenance.Conversations }, RATINGS]);
  });
});

import { ColDef, ColGroupDef, ColumnState, ValueFormatterParams } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import { applyColumnStateOrderToGroupedColDefs } from '@/src/components/Grid/utils';
import { baseNumberFilter, baseStringFilter } from '@/src/constants/grid-columns/filters';
import {
  CONVERSATIONS_TRACE_COLUMNS,
  CONVERSATIONS_TRACE_COLUMN_GROUPS,
} from '@/src/constants/grid-columns/grid-columns';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { ColumnProvenance, ConversationColumn, ConversationsField } from '@/src/models/analytics/conversations-trace';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';

const t = (key: string) => key;

const field = (
  name: string,
  type: AnalyticsFieldType,
  tag: string,
  overrides: Partial<AnalyticsEntityField> = {},
): AnalyticsEntityField => ({ name, source: name, type, tag, ...overrides });

const insight = (
  name: string,
  type: AnalyticsFieldType,
  tag: string,
  overrides: Partial<AnalyticsEntityField> = {},
): AnalyticsEntityField => ({
  name: `session_insights.${name}`,
  source: name,
  type,
  tag,
  ...overrides,
});

// An instance carrying every field this view can read, shaped after the live dev entity. Passed explicitly
// because a column renders only where the schema reports its field.
const ALL_FIELDS: AnalyticsEntityField[] = [
  field('client_session_id', AnalyticsFieldType.String, 'identity'),
  field('project_id', AnalyticsFieldType.String, 'principal'),
  field('user_hash', AnalyticsFieldType.String, 'principal'),
  field('turn_count', AnalyticsFieldType.Long, 'response'),
  field('success_count', AnalyticsFieldType.Long, 'response'),
  field('first_request_time', AnalyticsFieldType.Timestamp, 'identity'),
  field('last_request_time', AnalyticsFieldType.Timestamp, 'identity'),
  field('total_tokens', AnalyticsFieldType.Long, 'token-usage'),
  field('reasoning_tokens', AnalyticsFieldType.Long, 'token-usage', { display_name: 'Reasoning tokens' }),
  field('total_price', AnalyticsFieldType.Decimal, 'cost'),
  field('chain_price_total', AnalyticsFieldType.Decimal, 'cost', {
    display_name: 'Chain cost (top-down)',
    description: 'NULL whenever no turn has a chain-starting hop. A coverage gap, not an accounting difference.',
  }),
  field('duration_ms', AnalyticsFieldType.Long, 'performance', {
    description: "A hop's duration contains the durations of the hops it called.",
  }),
  field('avg_duration_ms', AnalyticsFieldType.Decimal, 'performance'),
  field('deployments', AnalyticsFieldType.Array, 'deployment', { display_name: 'Deployments' }),
  field('traces', AnalyticsFieldType.Array, 'identity', { display_name: 'Trace IDs', heavy: true }),
  insight('title', AnalyticsFieldType.String, 'insight', { display_name: 'Title' }),
  insight('summary', AnalyticsFieldType.String, 'insight', { display_name: 'Summary' }),
  insight('topics', AnalyticsFieldType.String, 'insight', { display_name: 'Topics' }),
  insight('sentiment', AnalyticsFieldType.String, 'insight', { display_name: 'Sentiment' }),
  insight('sentiment_score', AnalyticsFieldType.Decimal, 'insight'),
  insight('resolution_status', AnalyticsFieldType.String, 'insight', { display_name: 'Resolution status' }),
  insight('model', AnalyticsFieldType.String, 'provenance', {
    display_name: 'Model',
    description: 'DIAL deployment that produced this row.',
  }),
  insight('evaluator_version', AnalyticsFieldType.Integer, 'provenance'),
  insight('enriched_at', AnalyticsFieldType.Timestamp, 'provenance'),
  insight('truncated', AnalyticsFieldType.Boolean, 'provenance'),
];

const columns = (schemaFields: AnalyticsEntityField[] = ALL_FIELDS): ColDef[] =>
  CONVERSATIONS_TRACE_COLUMNS(t, schemaFields);

const column = (fieldName: string): ColDef => columns().find((col) => col.field === fieldName) as ColDef;

const format = (fieldName: string, value: unknown): string =>
  column(fieldName).valueFormatter?.({ value } as ValueFormatterParams) as string;

const groups = (schemaFields: AnalyticsEntityField[] = ALL_FIELDS): ColGroupDef[] =>
  CONVERSATIONS_TRACE_COLUMN_GROUPS(t, schemaFields);

const childFields = (group: ColGroupDef): string[] => (group.children as ColDef[]).map((col) => col.field as string);

// The rendered order, which is group order: groups are marryChildren, so a group's columns are adjacent.
const renderedColumns = (schemaFields: AnalyticsEntityField[] = ALL_FIELDS): ColDef[] =>
  groups(schemaFields).flatMap((group) => group.children as ColDef[]);

const CURATED = [
  ConversationsField.ChatId,
  ConversationsField.ProjectId,
  ConversationsField.UserHash,
  ConversationsField.TurnCount,
  ConversationsField.LastRequestTime,
  ConversationsField.TotalTokens,
  ConversationsField.TotalPrice,
  ConversationsField.Deployments,
  ConversationsField.InsightTopics,
  ConversationColumn.Rating,
];

// Restored by this amendment: each is a field the entity reports and no curated column reads. They were
// withdrawn when one of them — the insight model — rendered a column headed "Model" holding the evaluator's
// deployment; the tag grouping is what makes them safe to offer again.
const DERIVED = [
  'success_count',
  'reasoning_tokens',
  'chain_price_total',
  'duration_ms',
  'avg_duration_ms',
  'session_insights.summary',
  'session_insights.sentiment',
  'session_insights.sentiment_score',
  'session_insights.resolution_status',
  'session_insights.model',
  'session_insights.evaluator_version',
  'session_insights.enriched_at',
  'session_insights.truncated',
];

const HIDDEN_CURATED = [
  ConversationsField.TurnCount,
  ConversationsField.TotalTokens,
  ConversationsField.Deployments,
  ConversationsField.InsightTopics,
];

describe('conversations columns :: composition', () => {
  test('renders the curated columns and one column per field the schema reports besides', () => {
    const fields = columns().map((col) => col.field);

    CURATED.forEach((fieldName) => expect(fields).toContain(fieldName));
    DERIVED.forEach((fieldName) => expect(fields).toContain(fieldName));
  });

  // Asserting a number would restore the fixed list the schema is read to avoid.
  test('offers a column count that follows the schema rather than a fixed set', () => {
    const larger = [...ALL_FIELDS, field('extra_metric', AnalyticsFieldType.Long, 'cost')];

    expect(columns(larger).length).toBe(columns().length + 1);
  });

  test('curated headers come from i18n keys, not from the schema', () => {
    expect(column(ConversationsField.ChatId).headerName).toBe(ConversationsTraceI18nKey.Conversation);
    expect(column(ConversationsField.TotalPrice).headerName).toBe(ConversationsTraceI18nKey.Cost);
    expect(column(ConversationsField.InsightTopics).headerName).toBe(ConversationsTraceI18nKey.Topics);
  });

  test('a derived header comes from the display name the schema reports', () => {
    expect(column('chain_price_total').headerName).toBe('Chain cost (top-down)');
    expect(column('session_insights.resolution_status').headerName).toBe('Resolution status');
  });

  test('a derived header falls back to the field name rendered readably', () => {
    expect(column('avg_duration_ms').headerName).toBe('Avg duration ms');
    expect(column('session_insights.sentiment_score').headerName).toBe('Sentiment score');
  });

  test('a derived tooltip is the field description, unparaphrased', () => {
    expect(column('duration_ms').headerTooltip).toBe("A hop's duration contains the durations of the hops it called.");
    expect(column('chain_price_total').headerTooltip).toContain('coverage gap, not an accounting difference');
  });

  test('a derived column with no description carries no tooltip', () => {
    expect(column('avg_duration_ms').headerTooltip).toBeUndefined();
  });

  test.each(DERIVED)('%s defaults to hidden', (fieldName) => {
    expect(column(fieldName).hide).toBe(true);
  });

  test.each(HIDDEN_CURATED)('%s defaults to hidden', (fieldName) => {
    expect(column(fieldName).hide).toBe(true);
  });

  // An array is never derived into a column, whatever its flags. That is a rule about columns, not about
  // projection — `deployments` is an array with a hand-written column and is projected on every page.
  test('offers no column for an array field the curated set does not read', () => {
    expect(columns().map((col) => col.field)).not.toContain(ConversationsField.Traces);
  });

  test('offers no column for a sensitive field, which the caller would be refused', () => {
    const withSensitive = [...ALL_FIELDS, field('secret', AnalyticsFieldType.String, 'response', { sensitive: true })];

    expect(columns(withSensitive).map((col) => col.field)).not.toContain('secret');
  });

  test('offers no column for a request or response body, the entity reporting none', () => {
    const fields = columns().map((col) => col.field);

    expect(fields).not.toContain('request_body');
    expect(fields).not.toContain('response_body');
  });

  // The name and the id are one identity, shown as two lines of one column; a column of its own printed the
  // id twice wherever the enrichment had not reached.
  test('gives the insight title no column of its own', () => {
    expect(columns().map((col) => col.field)).not.toContain(ConversationsField.InsightTitle);
  });

  test('gives a field the activity cell composes no column of its own', () => {
    expect(columns().map((col) => col.field)).not.toContain(ConversationsField.FirstRequestTime);
  });

  // The set is today's; the order is not — grouping pulls last activity next to the id, which is accepted.
  test('the default view is the same six columns, in group order', () => {
    const visible = renderedColumns()
      .filter((col) => !col.hide)
      .map((col) => col.field);

    expect(visible).toEqual([
      ConversationsField.ChatId,
      ConversationsField.LastRequestTime,
      ConversationsField.ProjectId,
      ConversationsField.UserHash,
      ConversationsField.TotalPrice,
      ConversationColumn.Rating,
    ]);
  });

  test('the identity column cannot be hidden', () => {
    const identity = column(ConversationsField.ChatId);

    expect(identity.lockVisible).toBe(true);
    // The app renders its own columns panel rather than AG Grid's, and that panel reads only
    // `suppressColumnsToolPanel` — `lockVisible` alone would leave the checkbox live.
    expect(identity.suppressColumnsToolPanel).toBe(true);
  });

  test('every other column can be hidden', () => {
    columns()
      .filter((col) => col.field !== ConversationsField.ChatId)
      .forEach((col) => expect(col.lockVisible).toBeFalsy());
  });

  test('the identity column discloses where its title comes from', () => {
    expect(column(ConversationsField.ChatId).headerTooltip).toBe(ConversationsTraceI18nKey.ConversationHint);
  });

  test('the topics column discloses that its values come from an evaluation', () => {
    expect(column(ConversationsField.InsightTopics).headerTooltip).toBe(ConversationsTraceI18nKey.TopicsHint);
  });

  test('the conversation column renders through a cell renderer', () => {
    expect(column(ConversationsField.ChatId).cellRenderer).toBeTypeOf('function');
  });
});

describe('conversations columns :: origins and tags', () => {
  const groupOf = (provenance: ColumnProvenance, tag: string): ColGroupDef =>
    groups().find((group) => group.groupId === `${provenance}:${tag}`) as ColGroupDef;

  test('groups on the pair of origin and tag rather than on origin alone', () => {
    expect(childFields(groupOf(ColumnProvenance.Conversations, 'identity'))).toEqual([
      ConversationsField.ChatId,
      ConversationsField.LastRequestTime,
    ]);
    expect(childFields(groupOf(ColumnProvenance.Conversations, 'performance'))).toEqual([
      'duration_ms',
      'avg_duration_ms',
    ]);
  });

  test('a rollup group is named by its tag in readable words', () => {
    expect(groupOf(ColumnProvenance.Conversations, 'token-usage').headerName).toBe(
      ConversationsTraceI18nKey.TagTokenUsage,
    );
  });

  test('an enrichment group names the enrichment in its label, while a rollup group does not', () => {
    expect(groupOf(ColumnProvenance.Insights, 'insight').headerName).toBe(
      `${ConversationsTraceI18nKey.ProvenanceInsights} · ${ConversationsTraceI18nKey.TagInsight}`,
    );
    expect(groupOf(ColumnProvenance.Conversations, 'cost').headerName).toBe(ConversationsTraceI18nKey.TagCost);
  });

  test('the evaluator bookkeeping is grouped as the evaluator run, never as a bare column', () => {
    const bookkeeping = groupOf(ColumnProvenance.Insights, 'provenance');

    expect(bookkeeping.headerName).toBe(
      `${ConversationsTraceI18nKey.ProvenanceInsights} · ${ConversationsTraceI18nKey.TagProvenance}`,
    );
    expect(childFields(bookkeeping)).toContain('session_insights.model');
    expect(childFields(bookkeeping)).toContain('session_insights.enriched_at');
  });

  test('no column headed Model sits outside the evaluator run group', () => {
    const modelColumns = renderedColumns().filter((col) => col.headerName === 'Model');
    const bookkeeping = childFields(groupOf(ColumnProvenance.Insights, 'provenance'));

    modelColumns.forEach((col) => expect(bookkeeping).toContain(col.field));
  });

  test('an insight column is attributed to the enrichment, not the rollup', () => {
    expect(childFields(groupOf(ColumnProvenance.Insights, 'insight'))).toContain(ConversationsField.InsightTopics);
    expect(childFields(groupOf(ColumnProvenance.Conversations, 'identity'))).not.toContain(
      ConversationsField.InsightTopics,
    );
  });

  // A tag the service adds before this frontend has a label for it must cost an unlovely header, never a
  // dropped column.
  test('a tag it holds no label for still yields a group and keeps its columns', () => {
    const withNewTag = [...ALL_FIELDS, field('queue_depth', AnalyticsFieldType.Long, 'saturation')];
    const saturation = groups(withNewTag).find(
      (group) => group.groupId === `${ColumnProvenance.Conversations}:saturation`,
    ) as ColGroupDef;

    expect(saturation.headerName).toBe('saturation');
    expect(childFields(saturation)).toEqual(['queue_depth']);
  });

  test('two enrichments it cannot name get distinct groups and distinct ids', () => {
    const withTwo = [
      ...ALL_FIELDS,
      { name: 'conversation_buckets.cost_bucket', source: 'cost_bucket', type: AnalyticsFieldType.String, tag: 'cost' },
      { name: 'conversation_topics.cost_rank', source: 'cost_rank', type: AnalyticsFieldType.String, tag: 'cost' },
    ];
    const unnamed = groups(withTwo).filter((group) => (group.groupId as string).startsWith(ColumnProvenance.Other));

    expect(unnamed.map((group) => group.groupId)).toEqual([
      `${ColumnProvenance.Other}:conversation_buckets:cost`,
      `${ColumnProvenance.Other}:conversation_topics:cost`,
    ]);
    expect(unnamed.map((group) => group.headerName)).toEqual([
      `conversation_buckets · ${ConversationsTraceI18nKey.TagCost}`,
      `conversation_topics · ${ConversationsTraceI18nKey.TagCost}`,
    ]);
  });

  test('an enrichment this frontend cannot name is grouped separately from the rollup', () => {
    const withBuckets = [
      ...ALL_FIELDS,
      { name: 'conversation_buckets.bucket', source: 'bucket', type: AnalyticsFieldType.String, tag: 'cost' },
    ];
    const costGroups = groups(withBuckets).filter((group) => (group.groupId as string).endsWith(':cost'));

    expect(costGroups).toHaveLength(2);
    expect(costGroups.map((group) => group.groupId)).toContain(`${ColumnProvenance.Other}:conversation_buckets:cost`);
  });

  test('every column is attributed to exactly one group', () => {
    const attributed = groups().flatMap(childFields);
    const all = columns().map((col) => col.field as string);

    expect([...attributed].sort()).toEqual([...all].sort());
    expect(new Set(attributed).size).toBe(attributed.length);
  });

  test('each group states its origin on hover, so colour is not the only carrier', () => {
    expect(groupOf(ColumnProvenance.Insights, 'insight').headerTooltip).toContain(
      ConversationsTraceI18nKey.ProvenanceInsights,
    );
    expect(groupOf(ColumnProvenance.Conversations, 'cost').headerTooltip).toContain(
      ConversationsTraceI18nKey.ProvenanceConversations,
    );
  });

  // Without marryChildren a group header would span columns read from somewhere else.
  test('groups keep their columns adjacent', () => {
    groups().forEach((group) => expect(group.marryChildren).toBe(true));
  });

  test('a group whose columns the schema does not report is not rendered at all', () => {
    const withoutInsights = ALL_FIELDS.filter((entry) => !entry.name.startsWith('session_insights.'));

    expect(groups(withoutInsights).map((group) => group.groupId)).not.toContain(`${ColumnProvenance.Insights}:insight`);
  });

  test('groups collapse to one per origin when no schema was read', () => {
    expect(groups([]).map((group) => group.headerName)).toEqual([
      ConversationsTraceI18nKey.ProvenanceConversations,
      ConversationsTraceI18nKey.ProvenanceFeedback,
    ]);
  });
});

describe('conversations columns :: a lagging deployment', () => {
  const WITHOUT_INSIGHTS = ALL_FIELDS.filter((entry) => !entry.name.startsWith('session_insights.'));

  test('omits the topics column when the schema reports no insight field', () => {
    expect(columns(WITHOUT_INSIGHTS).map((col) => col.field)).not.toContain(ConversationsField.InsightTopics);
  });

  test('keeps the columns the instance does carry', () => {
    const fields = columns(WITHOUT_INSIGHTS).map((col) => col.field);

    expect(fields).toContain(ConversationsField.ChatId);
    expect(fields).toContain(ConversationsField.Deployments);
    expect(fields).toContain('duration_ms');
  });

  test('keeps the rating column, which reads no field of this entity', () => {
    expect(columns(WITHOUT_INSIGHTS).map((col) => col.field)).toContain(ConversationColumn.Rating);
    expect(columns([]).map((col) => col.field)).toContain(ConversationColumn.Rating);
  });

  test('falls back to the curated columns alone when no schema is given', () => {
    expect(columns([]).map((col) => col.field)).toEqual(
      CURATED.filter((fieldName) => fieldName !== ConversationsField.InsightTopics),
    );
  });
});

describe('conversations columns :: sort and filter contract', () => {
  const SORTABLE = [
    ConversationsField.ChatId,
    ConversationsField.ProjectId,
    ConversationsField.UserHash,
    ConversationsField.TurnCount,
    ConversationsField.LastRequestTime,
    ConversationsField.TotalTokens,
    ConversationsField.TotalPrice,
  ];

  test.each(SORTABLE)('%s is sortable, because the query can order the whole result by it', (fieldName) => {
    expect(column(fieldName).sortable).not.toBe(false);
  });

  test('a derived scalar column is sortable, being a stored field of the same entity', () => {
    expect(column('duration_ms').sortable).not.toBe(false);
    expect(column('session_insights.sentiment').sortable).not.toBe(false);
  });

  test('rating is not sortable and offers no filter', () => {
    expect(column(ConversationColumn.Rating).sortable).toBe(false);
    expect(column(ConversationColumn.Rating).filter).toBe(false);
  });

  // No ordering of an array is expressible, but a predicate over its elements is.
  test('deployments offers a text filter but no sort', () => {
    expect(column(ConversationsField.Deployments).sortable).toBe(false);
    expect(column(ConversationsField.Deployments).filter).not.toBe(false);
    expect(column(ConversationsField.Deployments).filterParams?.filterOptions).toEqual(
      baseStringFilter.filterParams?.filterOptions,
    );
  });

  // A delimited string: order would follow whichever term was written first, while a contains predicate
  // matches a term wherever it sits.
  test('topics offers a text filter but no sort', () => {
    expect(column(ConversationsField.InsightTopics).sortable).toBe(false);
    expect(column(ConversationsField.InsightTopics).filter).not.toBe(false);
    expect(column(ConversationsField.InsightTopics).filterParams?.filterOptions).toEqual(
      baseStringFilter.filterParams?.filterOptions,
    );
  });

  test.each([[ConversationsField.ChatId], [ConversationsField.ProjectId], [ConversationsField.UserHash]])(
    '%s offers a text filter',
    (fieldName) => {
      expect(column(fieldName).filter).not.toBe(false);
      expect(column(fieldName).filterParams?.filterOptions).toEqual(baseStringFilter.filterParams?.filterOptions);
    },
  );

  test.each([[ConversationsField.TurnCount], [ConversationsField.TotalTokens], [ConversationsField.TotalPrice]])(
    '%s offers a number filter',
    (fieldName) => {
      expect(column(fieldName).filter).toBe(baseNumberFilter.filter);
      expect(column(fieldName).filterParams?.filterOptions).toEqual(baseNumberFilter.filterParams?.filterOptions);
    },
  );

  // `agDateColumnFilter` reports `dateFrom`/`dateTo`, which the grid's filter translation does not read — the
  // entry would be dropped and the header would show an active filter over an unnarrowed result.
  test('a derived timestamp column sorts but offers no filter', () => {
    expect(column('session_insights.enriched_at').sortable).not.toBe(false);
    expect(column('session_insights.enriched_at').filter).toBe(false);
    expect(column('session_insights.enriched_at').floatingFilter).toBe(false);
  });

  // The text filter would offer `contains`, which the language cannot express over a boolean; the service
  // rejects the whole query for one bad predicate, so the filter menu could take the listing down.
  test('a derived boolean column sorts but offers no filter', () => {
    expect(column('session_insights.truncated').sortable).not.toBe(false);
    expect(column('session_insights.truncated').filter).toBe(false);
    expect(column('session_insights.truncated').floatingFilter).toBe(false);
  });

  test('a derived column filters by its declared type', () => {
    expect(column('duration_ms').filter).toBe(baseNumberFilter.filter);
    expect(column('session_insights.sentiment').filterParams?.filterOptions).toEqual(
      baseStringFilter.filterParams?.filterOptions,
    );
  });

  // The closed vocabularies stay string columns: the enumeration is declared in the evaluator's own response
  // schema, so a value-list filter would mean a second copy here, drifting on every re-version.
  test('sentiment and resolution status offer string operators, not a copied enumeration', () => {
    [column('session_insights.sentiment'), column('session_insights.resolution_status')].forEach((col) => {
      expect(col.filterParams?.filterOptions).toEqual(baseStringFilter.filterParams?.filterOptions);
      expect(col.filterParams?.values).toBeUndefined();
    });
  });

  // A date filter here would also have to survive AG Grid's date model reaching a service that parses only
  // epoch millis.
  test('activity sorts but offers no filter, because the period control owns that axis', () => {
    expect(column(ConversationsField.LastRequestTime).sortable).not.toBe(false);
    expect(column(ConversationsField.LastRequestTime).filter).toBe(false);
    expect(column(ConversationsField.LastRequestTime).floatingFilter).toBe(false);
  });

  test('text filters offer no prefix or suffix matching', () => {
    const options = column(ConversationsField.ChatId).filterParams?.filterOptions as string[];

    expect(options).not.toContain('startsWith');
    expect(options).not.toContain('endsWith');
  });

  test('the default ordering is stated as a sort model on activity', () => {
    expect(column(ConversationsField.LastRequestTime).sort).toBe('desc');
    expect(columns().filter((col) => col.sort).length).toBe(1);
  });

  test('no column is editable', () => {
    columns().forEach((col) => expect(col.editable).toBeFalsy());
  });
});

describe('conversations columns :: proportions', () => {
  test('the conversation column is the widest', () => {
    const flexes = columns().map((col) => col.flex ?? 0);

    expect(column(ConversationsField.ChatId).flex).toBe(Math.max(...flexes));
  });

  test('the conversation column reserves room for a production-length id', () => {
    expect(column(ConversationsField.ChatId).minWidth).toBeGreaterThanOrEqual(280);
  });

  test('the user column is sized for a hash rather than a display name', () => {
    expect(column(ConversationsField.UserHash).minWidth).toBeGreaterThanOrEqual(140);
    expect(column(ConversationsField.UserHash).flex).toBeLessThan(column(ConversationsField.ProjectId).flex as number);
  });

  test('numeric columns are narrower than the conversation column', () => {
    [ConversationsField.TurnCount, ConversationsField.TotalTokens, ConversationsField.TotalPrice].forEach(
      (fieldName) => {
        expect(column(fieldName).flex).toBeLessThan(column(ConversationsField.ChatId).flex as number);
      },
    );
  });
});

describe('conversations columns :: value formatting', () => {
  test('token counts are compacted rather than delimited', () => {
    expect(format(ConversationsField.TotalTokens, 1284507)).toBe('1.3 M');
    expect(format(ConversationsField.TotalTokens, 7200)).toBe('7.2 K');
  });

  test('cost renders as currency', () => {
    expect(format(ConversationsField.TotalPrice, '0.09')).toBe('$0.09');
  });

  // The shared currency formatter renders every digit of a Decimal(38,12) sum; this column rounds instead, so a
  // real sum stays readable. The rounding is local to this page and leaves other price columns unchanged.
  test('a full-scale decimal cost is rounded to significant digits', () => {
    expect(format(ConversationsField.TotalPrice, '0.090000000001')).toBe('$0.09');
    expect(format(ConversationsField.TotalPrice, '0.003612544180')).toBe('$0.0036');
  });

  test.each([[ConversationsField.TotalTokens], [ConversationsField.TotalPrice], [ConversationsField.TurnCount]])(
    '%s renders empty for a null aggregate rather than 0 or NaN',
    (fieldName) => {
      const formatted = format(fieldName, null);

      expect(formatted).toBe('');
      expect(formatted).not.toContain('NaN');
    },
  );

  // Activity moved to a cell renderer so it can stack the relative time over the span; both wire shapes and the
  // null case are covered by ActivityCellRenderer's own tests.
  test('activity renders through a cell renderer rather than a value formatter', () => {
    expect(column(ConversationsField.LastRequestTime).valueFormatter).toBeUndefined();
    expect(typeof column(ConversationsField.LastRequestTime).cellRenderer).toBe('function');
  });

  test('project renders through a cell renderer so an unattributed project is marked', () => {
    expect(typeof column(ConversationsField.ProjectId).cellRenderer).toBe('function');
  });

  test('user renders through a cell renderer so a missing hash is marked', () => {
    expect(typeof column(ConversationsField.UserHash).cellRenderer).toBe('function');
    expect(column(ConversationsField.UserHash).valueFormatter).toBeUndefined();
  });

  // Which value is a model is not derivable from the array: a router deployed under a plain name looks like a
  // model, and an embedding deployment that was billed belongs to the billed set. Measured against
  // `turns.models`, the old name heuristic kept orchestrators and dropped billed embeddings — so the column
  // names the field it reads and renders it whole.
  test('deployments renders the recorded array through a cell renderer, unnarrowed', () => {
    const deploymentsColumn = column(ConversationsField.Deployments);
    const params = deploymentsColumn.cellRendererParams as (params: unknown) => {
      items: string[];
      allItems: string[];
    };
    const deployments = [
      'applications/public/qa__0.0.1',
      'azure-ai-vision-embeddings',
      'generic-rag-app',
      'gpt-4.1-2025-04-14',
    ];

    expect(typeof deploymentsColumn.cellRenderer).toBe('function');
    expect(params({ data: { deployments } })).toMatchObject({ items: deployments, allItems: deployments });
  });

  test('the deployments tooltip states every recorded deployment', () => {
    const deploymentsColumn = column(ConversationsField.Deployments);
    const deployments = ['applications/public/qa__0.0.1', 'gpt-4.1-2025-04-14'];

    expect(deploymentsColumn.tooltipValueGetter?.({ data: { deployments } } as never)).toBe(
      'applications/public/qa__0.0.1, gpt-4.1-2025-04-14',
    );
  });

  test('topics renders through a cell renderer and keeps its whole list in the tooltip', () => {
    const topicsColumn = column(ConversationsField.InsightTopics);
    const data = { 'session_insights.topics': 'security, code review,validation' };

    expect(typeof topicsColumn.cellRenderer).toBe('function');
    expect(topicsColumn.tooltipValueGetter?.({ data } as never)).toBe('security, code review, validation');
  });

  test('a conversation the evaluation has not reached carries no topics tooltip', () => {
    expect(column(ConversationsField.InsightTopics).tooltipValueGetter?.({ data: {} } as never)).toBeNull();
  });
});

// A stored choice recorded against the previously shipped ten columns meets a set several times larger, so
// the guarantee is asserted rather than assumed: a column the stored state does not name stays hidden.
describe('conversations columns :: a stored choice from the smaller set', () => {
  const STORED_STATE: ColumnState[] = CURATED.map((colId) => ({
    colId,
    hide: !(
      colId === ConversationsField.ChatId ||
      colId === ConversationsField.ProjectId ||
      colId === ConversationsField.UserHash ||
      colId === ConversationsField.LastRequestTime ||
      colId === ConversationsField.TotalPrice ||
      colId === ConversationColumn.Rating
    ),
  }));

  const restored = (): ColDef[] =>
    applyColumnStateOrderToGroupedColDefs(groups() as ColDef[], STORED_STATE).flatMap(
      (group) => (group as ColGroupDef).children as ColDef[],
    );

  test('honours the stored choice for the columns it names', () => {
    const visible = restored()
      .filter((col) => !col.hide)
      .map((col) => col.field);

    expect(visible).toEqual([
      ConversationsField.ChatId,
      ConversationsField.LastRequestTime,
      ConversationsField.ProjectId,
      ConversationsField.UserHash,
      ConversationsField.TotalPrice,
      ConversationColumn.Rating,
    ]);
  });

  test('leaves every column it does not name hidden', () => {
    const stored = new Set<string>(STORED_STATE.map((state) => state.colId));

    restored()
      .filter((col) => !stored.has(col.field as string))
      .forEach((col) => expect(col.hide).toBe(true));
  });
});

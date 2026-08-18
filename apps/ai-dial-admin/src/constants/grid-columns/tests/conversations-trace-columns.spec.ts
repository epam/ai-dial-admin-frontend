import { ColDef, ValueFormatterParams } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { baseNumberFilter, baseStringFilter } from '@/src/constants/grid-columns/filters';
import { CONVERSATIONS_TRACE_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { ConversationColumn, ConversationsField } from '@/src/models/analytics/conversations-trace';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';

const t = (key: string) => key;

// An instance carrying every field this view can read. Passing it explicitly is the point: a curated column
// renders only where the schema reports its field, so a test that omits the schema is describing a lagging
// deployment rather than the full column set.
const schemaOf = (names: string[]): AnalyticsEntityField[] =>
  names.map((name) => ({ name, type: AnalyticsFieldType.String, source: 'conversations' }));

const ALL_FIELDS = schemaOf(Object.values(ConversationsField));

const columns = (schemaFields: AnalyticsEntityField[] = ALL_FIELDS): ColDef[] =>
  CONVERSATIONS_TRACE_COLUMNS(t, schemaFields);

const column = (fieldName: string): ColDef => columns().find((col) => col.field === fieldName) as ColDef;

const format = (fieldName: string, value: unknown): string =>
  column(fieldName).valueFormatter?.({ value } as ValueFormatterParams) as string;

const DEFAULT_VISIBLE = [
  ConversationsField.ChatId,
  ConversationsField.InsightTitle,
  ConversationsField.ProjectId,
  ConversationsField.UserHash,
  ConversationsField.TurnCount,
  ConversationsField.LastRequestTime,
  ConversationsField.TotalTokens,
  ConversationsField.TotalPrice,
  ConversationsField.DurationMs,
  ConversationsField.Deployments,
  ConversationColumn.Rating,
];

const INSIGHT_COLUMNS = [
  ConversationsField.InsightSentiment,
  ConversationsField.InsightSentimentScore,
  ConversationsField.InsightTopic,
  ConversationsField.InsightTopics,
  ConversationsField.InsightLanguage,
  ConversationsField.InsightResolutionStatus,
];

const USAGE_COLUMNS = [
  ConversationsField.CacheCreationTokens,
  ConversationsField.CachedPromptTokens,
  ConversationsField.ReasoningTokens,
  ConversationsField.ChainPriceTotal,
];

describe('conversations columns :: composition', () => {
  test('exposes the curated columns, default-visible ones first and in order', () => {
    expect(columns().map((col) => col.field)).toEqual([...DEFAULT_VISIBLE, ...INSIGHT_COLUMNS, ...USAGE_COLUMNS]);
  });

  test('headers come from i18n keys, not hardcoded strings', () => {
    expect(columns().map((col) => col.headerName)).toEqual([
      ConversationsTraceI18nKey.Conversation,
      ConversationsTraceI18nKey.DetailTitleField,
      ConversationsTraceI18nKey.Project,
      ConversationsTraceI18nKey.DetailUser,
      ConversationsTraceI18nKey.Turns,
      ConversationsTraceI18nKey.Activity,
      ConversationsTraceI18nKey.Tokens,
      ConversationsTraceI18nKey.Cost,
      ConversationsTraceI18nKey.Duration,
      ConversationsTraceI18nKey.Deployments,
      ConversationsTraceI18nKey.Rating,
      ConversationsTraceI18nKey.Sentiment,
      ConversationsTraceI18nKey.SentimentScore,
      ConversationsTraceI18nKey.Topic,
      ConversationsTraceI18nKey.Topics,
      ConversationsTraceI18nKey.Language,
      ConversationsTraceI18nKey.ResolutionStatus,
      ConversationsTraceI18nKey.CacheCreationTokens,
      ConversationsTraceI18nKey.CachedPromptTokens,
      ConversationsTraceI18nKey.ReasoningTokens,
      ConversationsTraceI18nKey.ChainCost,
    ]);
  });

  test('the title column is visible and sits beside the conversation id', () => {
    const fields = columns().map((col) => col.field);

    expect(column(ConversationsField.InsightTitle).hide).toBeUndefined();
    expect(fields.indexOf(ConversationsField.InsightTitle)).toBe(fields.indexOf(ConversationsField.ChatId) + 1);
  });

  test('every other new column defaults to hidden', () => {
    for (const fieldName of [...INSIGHT_COLUMNS, ...USAGE_COLUMNS]) {
      expect(column(fieldName).hide).toBe(true);
    }
  });

  // Sentiment or a resolution status is derived by an evaluation rather than recorded by DIAL, and an empty
  // cell means not-yet-evaluated — so each header has to say where the value came from.
  test('each insight column discloses that its value comes from an evaluation', () => {
    for (const fieldName of [ConversationsField.InsightTitle, ...INSIGHT_COLUMNS]) {
      expect(column(fieldName).headerTooltip).toBe(ConversationsTraceI18nKey.InsightHint);
    }
  });

  test('the chain cost column discloses its coverage gap', () => {
    expect(column(ConversationsField.ChainPriceTotal).headerTooltip).toBe(ConversationsTraceI18nKey.ChainCostHint);
  });

  // NULL wherever no turn of the conversation starts a chain carrying a chat id — a coverage gap, not a
  // conversation that cost nothing.
  test('an absent chain cost renders empty rather than as a zero', () => {
    expect(format(ConversationsField.ChainPriceTotal, null)).toBe('');
    expect(format(ConversationsField.ChainPriceTotal, 0)).toBe('$0');
  });

  test('the title column renders through a cell renderer', () => {
    expect(column(ConversationsField.InsightTitle).cellRenderer).toBeTypeOf('function');
  });

  test('the user column reuses the label the detail page uses for the same field', () => {
    expect(column(ConversationsField.UserHash).headerName).toBe(ConversationsTraceI18nKey.DetailUser);
  });

  test('the conversation column renders through a cell renderer', () => {
    expect(column(ConversationsField.ChatId).cellRenderer).toBeTypeOf('function');
  });
});

// The rollups are provisioned per ADAS instance rather than shipped with the service, so an instance can
// carry an older field set. A column reading a field it does not have could never fill, and the query cannot
// name that field at all — so the column is omitted rather than rendered empty.
describe('conversations columns :: a lagging deployment', () => {
  const WITHOUT_INSIGHTS = schemaOf(
    Object.values(ConversationsField).filter((name) => !name.startsWith('conversation_insights.')),
  );

  test('omits every insight column when the schema reports no insight field', () => {
    const fields = columns(WITHOUT_INSIGHTS).map((col) => col.field);

    for (const fieldName of [ConversationsField.InsightTitle, ...INSIGHT_COLUMNS]) {
      expect(fields).not.toContain(fieldName);
    }
  });

  test('keeps the columns the instance does carry', () => {
    const fields = columns(WITHOUT_INSIGHTS).map((col) => col.field);

    expect(fields).toContain(ConversationsField.ChatId);
    expect(fields).toContain(ConversationsField.Deployments);
    expect(fields).toContain(ConversationsField.ChainPriceTotal);
  });

  // Rating is composed from the feedback lookups, so no conversations schema will ever report it.
  test('keeps the rating column, which reads no field of this entity', () => {
    expect(columns(WITHOUT_INSIGHTS).map((col) => col.field)).toContain(ConversationColumn.Rating);
    expect(columns([]).map((col) => col.field)).toContain(ConversationColumn.Rating);
  });

  // Without a schema nothing optional can be confirmed to exist, and the select names the required core
  // alone — so the column set matches that projection rather than promising columns it cannot fill.
  test('falls back to the original curated columns when no schema is given', () => {
    const fields = columns([]).map((col) => col.field);

    expect(fields).toEqual([
      ConversationsField.ChatId,
      ConversationsField.ProjectId,
      ConversationsField.UserHash,
      ConversationsField.TurnCount,
      ConversationsField.LastRequestTime,
      ConversationsField.TotalTokens,
      ConversationsField.TotalPrice,
      ConversationsField.DurationMs,
      ConversationsField.Deployments,
      ConversationColumn.Rating,
    ]);
  });
});

describe('conversations columns :: sort and filter contract', () => {
  const FIELD_BACKED = [
    ConversationsField.ChatId,
    ConversationsField.ProjectId,
    ConversationsField.UserHash,
    ConversationsField.TurnCount,
    ConversationsField.LastRequestTime,
    ConversationsField.TotalTokens,
    ConversationsField.TotalPrice,
    ConversationsField.DurationMs,
  ];

  test.each(FIELD_BACKED)('%s is sortable, because the query can order the whole result by it', (fieldName) => {
    expect(column(fieldName).sortable).not.toBe(false);
  });

  test('rating is not sortable and offers no filter', () => {
    expect(column(ConversationColumn.Rating).sortable).toBe(false);
    expect(column(ConversationColumn.Rating).filter).toBe(false);
  });

  // The query language expresses no ordering or predicate over an array, and the grid pages server-side, so a
  // client-side comparator would order the loaded page and misstate what it did.
  test('models offers neither a sort nor a filter affordance', () => {
    expect(column(ConversationsField.Deployments).sortable).toBe(false);
    expect(column(ConversationsField.Deployments).filter).toBe(false);
  });

  test.each([[ConversationsField.ChatId], [ConversationsField.ProjectId], [ConversationsField.UserHash]])(
    '%s offers a text filter',
    (fieldName) => {
      expect(column(fieldName).filter).not.toBe(false);
      expect(column(fieldName).filterParams?.filterOptions).toEqual(baseStringFilter.filterParams?.filterOptions);
    },
  );

  test.each([
    [ConversationsField.TurnCount],
    [ConversationsField.TotalTokens],
    [ConversationsField.TotalPrice],
    [ConversationsField.DurationMs],
  ])('%s offers a number filter', (fieldName) => {
    expect(column(fieldName).filter).toBe(baseNumberFilter.filter);
    expect(column(fieldName).filterParams?.filterOptions).toEqual(baseNumberFilter.filterParams?.filterOptions);
  });

  test('activity sorts but offers no filter', () => {
    expect(column(ConversationsField.LastRequestTime).sortable).not.toBe(false);
    expect(column(ConversationsField.LastRequestTime).filter).toBe(false);
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

  test.each([
    ['a sub-minute duration', 6709, '6.7s'],
    ['a multi-minute duration', 275234, '4m 35s'],
  ])('duration renders %s as %s', (_label, value, expected) => {
    expect(format(ConversationsField.DurationMs, value)).toBe(expected);
  });

  // A conversation that ran took time, so a 0 records that the backend never measured it.
  test('duration renders an unmeasured zero as the unavailable marker rather than 0s', () => {
    expect(format(ConversationsField.DurationMs, 0)).toBe(UNAVAILABLE_VALUE);
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
      'statgpt-generic-rag-swiss-re',
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
});

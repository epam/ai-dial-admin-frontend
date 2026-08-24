import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import {
  ColumnProvenance,
  ConversationColumn,
  ConversationDetailPanel,
  ConversationFieldFormat,
  ConversationFilterOperator,
  ConversationPanelDefinition,
  ConversationPanelLayout,
  ConversationsField,
  HopEventType,
  ProvenanceEntity,
  SpanCategory,
  UsageLogField,
} from '@/src/models/analytics/conversations-trace';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryOperator, QueryValueType } from '@/src/models/analytics/query';
import { GridFilterType } from '@/src/types/grid-filter';

export const CONVERSATIONS_ENTITY = 'conversations';

export const FEEDBACK_ENTITY = 'rate_analytics';

export const USAGE_LOG_ENTITY = 'dial_usage_log';

export const TURNS_ENTITY = 'turns';

export const CONVERSATION_TURN_LIMIT = 200;

export const CONVERSATION_ENTRY_HOP_LIMIT = CONVERSATION_TURN_LIMIT;

export const CONVERSATION_SPAN_LIMIT = 300;

export const USAGE_LOG_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;

export const MCP_PROTOCOL_METHODS: string[] = [
  'initialize',
  'notifications/initialized',
  'tools/list',
  'resources/list',
  'prompts/list',
  'resources/templates/list',
  'server/discover',
  'ping',
  'logging/setLevel',
];

export const UTILITY_URI_MARKERS: string[] = ['count_tokens', '/tokenize', '/truncate_prompt'];

export const ROUTE_EVENT_KIND = 'route';

export const MCP_EVENT_KIND = 'mcp';

export const STREAM_MODEL_BODY_LIMIT = 80;

export const STREAM_MODEL_BODY_BYTE_BUDGET = 24 * 1024 * 1024;

export const TOOL_ARGUMENTS_PREVIEW_LIMIT = 200;

export const MODEL_CALL_URI_MARKERS: string[] = [
  '/chat/completions',
  '/v1/messages',
  '/v1/responses',
  '/v1/completions',
];

export const CONVERSATION_HOP_COUNT_ALIAS = 'hop_count';

// Both body columns are named only when the fetched schema reports them: an instance can persist the
// assembled column without `response_body`, or the reverse, and one unknown field rejects the whole query.
export const OPTIONAL_USAGE_LOG_FIELDS: UsageLogField[] = [UsageLogField.AssembledResponse, UsageLogField.ResponseBody];

export const TRANSCRIPT_REQUIRED_FIELD: UsageLogField = UsageLogField.RequestBody;

export const TRANSCRIPT_RESPONSE_FIELDS: UsageLogField[] = [
  UsageLogField.AssembledResponse,
  UsageLogField.ResponseBody,
];

export const FEEDBACK_CANDIDATE_LIMIT = 1000;

export const POSITIVE_RATE_EXCLUSIVE_MIN = 0;

export const CONVERSATIONS_TIME_PERIOD = '7d';

export const CONVERSATIONS_SEARCH_DEBOUNCE_MS = 400;

export const CONVERSATIONS_ROW_HEIGHT = 64;

export const CONVERSATIONS_GROUP_HEADER_HEIGHT = 32;

export const CONVERSATIONS_HEADER_HEIGHT = 38;

export const CONVERSATIONS_FLOATING_FILTER_HEIGHT = 38;

export const CONVERSATIONS_HEADER_STACK_HEIGHT =
  CONVERSATIONS_GROUP_HEADER_HEIGHT + CONVERSATIONS_HEADER_HEIGHT + CONVERSATIONS_FLOATING_FILTER_HEIGHT;

export const CONVERSATIONS_STORAGE_KEY = 'analytics/conversations';

export const SUMMARY_COST_PRECISION = 3;

// Below a dollar, cost is rendered at significant digits; from a dollar up, rounded and abbreviated.
export const COST_COMPACT_THRESHOLD = 1;

export const COST_SIGNIFICANT_DIGITS = 2;

export const REQUIRED_DETAIL_SELECT_FIELDS: ConversationsField[] = [
  ConversationsField.ChatId,
  ConversationsField.ProjectId,
  ConversationsField.UserHash,
  ConversationsField.TurnCount,
  ConversationsField.FirstRequestTime,
  ConversationsField.LastRequestTime,
  ConversationsField.PromptTokens,
  ConversationsField.CompletionTokens,
  ConversationsField.TotalTokens,
  ConversationsField.TotalPrice,
  ConversationsField.SuccessCount,
  ConversationsField.DurationMs,
  ConversationsField.AvgDurationMs,
  ConversationsField.Deployments,
];

// Fields beyond the view's original set that a curated column still reads. Each is a catalog object an
// instance may not carry yet, so a query names one only when the fetched schema reports it, and a curated
// column reading one is not rendered at all where it is absent.
export const OPTIONAL_CURATED_COLUMN_FIELDS: ConversationsField[] = [ConversationsField.InsightTopics];

// Enrichment-backed fields the identity column reads. Unlike every other enrichment field, these are not
// projected on column visibility: the column that reads them is the one column the view cannot hide, so
// the join is paid on every page. That is the cost of naming a conversation by anything other than its id.
export const IDENTITY_ENRICHMENT_FIELDS: ConversationsField[] = [ConversationsField.InsightTitle];

export const OPTIONAL_DETAIL_SELECT_FIELDS: ConversationsField[] = [
  ...OPTIONAL_CURATED_COLUMN_FIELDS,
  ...IDENTITY_ENRICHMENT_FIELDS,
  // Read by the detail view alone. The log states the size cap once, for the whole column, because it holds
  // for the large majority of titled conversations — so the list query never names this field.
  ConversationsField.InsightTruncated,
  ConversationsField.Traces,
];

// Only where the query can order the whole result by the field: paging is server-side, so a sort the backend
// cannot express would reorder one loaded block and report a slice as the answer. `deployments` and `topics`
// are absent by design — the language expresses no ordering over an array, and a delimited string would sort
// by whichever term happens to be written first.
export const SORTABLE_CONVERSATION_FIELDS: ConversationsField[] = [
  ConversationsField.ChatId,
  ConversationsField.ProjectId,
  ConversationsField.UserHash,
  ConversationsField.TurnCount,
  ConversationsField.LastRequestTime,
  ConversationsField.TotalTokens,
  ConversationsField.TotalPrice,
];

// `last_request_time` is deliberately absent: the toolbar's period control already predicates on it, and a
// second control over the same axis would let a filter appear to widen a range the period clips.
export const FILTERABLE_CONVERSATION_FIELDS: ConversationsField[] = [
  ConversationsField.ChatId,
  ConversationsField.ProjectId,
  ConversationsField.UserHash,
  ConversationsField.TurnCount,
  ConversationsField.TotalTokens,
  ConversationsField.TotalPrice,
  ConversationsField.InsightTopics,
];

export const CURATED_COMPOSED_FIELDS: string[] = [ConversationsField.FirstRequestTime, ...IDENTITY_ENRICHMENT_FIELDS];

// A grid cell is not a structured-value viewer, so a field of one of these types is never derived into a
// column: rendering it as text would assert a shape this view does not know. A curated column may still read
// one, having a presentation of its own.
export const NON_SCALAR_FIELD_TYPES: AnalyticsFieldType[] = [AnalyticsFieldType.Object, AnalyticsFieldType.Array];

export const DATE_FIELD_TYPES: AnalyticsFieldType[] = [AnalyticsFieldType.Date, AnalyticsFieldType.Timestamp];

export const NUMERIC_FIELD_TYPES: AnalyticsFieldType[] = [
  AnalyticsFieldType.Integer,
  AnalyticsFieldType.Long,
  AnalyticsFieldType.Decimal,
];

export const ANALYTICS_FIELD_QUERY_VALUE_TYPE: Partial<Record<AnalyticsFieldType, QueryValueType>> = {
  [AnalyticsFieldType.Uuid]: QueryValueType.String,
  [AnalyticsFieldType.String]: QueryValueType.String,
  [AnalyticsFieldType.Integer]: QueryValueType.Integer,
  [AnalyticsFieldType.Long]: QueryValueType.Long,
  [AnalyticsFieldType.Decimal]: QueryValueType.Decimal,
  [AnalyticsFieldType.Boolean]: QueryValueType.Boolean,
  [AnalyticsFieldType.Date]: QueryValueType.Date,
  [AnalyticsFieldType.Timestamp]: QueryValueType.Timestamp,
};

export const ENRICHMENT_PROVENANCE: Record<string, ColumnProvenance> = {
  conversation_insights: ColumnProvenance.Insights,
};

export const PROVENANCE_LABEL_KEY: Partial<Record<ColumnProvenance, string>> = {
  [ColumnProvenance.Conversations]: ConversationsTraceI18nKey.ProvenanceConversations,
  [ColumnProvenance.Insights]: ConversationsTraceI18nKey.ProvenanceInsights,
  [ColumnProvenance.Feedback]: ConversationsTraceI18nKey.ProvenanceFeedback,
};

export const PROVENANCE_HINT_KEY: Record<ColumnProvenance, string> = {
  [ColumnProvenance.Conversations]: ConversationsTraceI18nKey.ProvenanceConversationsHint,
  [ColumnProvenance.Insights]: ConversationsTraceI18nKey.ProvenanceInsightsHint,
  [ColumnProvenance.Feedback]: ConversationsTraceI18nKey.ProvenanceFeedbackHint,
  [ColumnProvenance.Other]: ConversationsTraceI18nKey.ProvenanceEnrichmentHint,
};

// Readable names for the tags the service reports, because a header showing `token-usage` presents a catalog
// identifier where a reader needs words. A tag missing from here falls back to its raw value: an unlovely
// header, never a dropped column.
//
// `provenance` is the one entry doing real work. Its five fields are the evaluation's own bookkeeping, and
// one of them reports the display name "Model" while holding the evaluator's deployment. Labelled with the
// raw tag it would read as a category; labelled as the evaluator's run it reads as what it is. It is also
// why this map must not simply title-case the tag: "Provenance" already means a column's origin here.
export const CONVERSATION_TAG_LABEL_KEY: Record<string, string> = {
  identity: ConversationsTraceI18nKey.TagIdentity,
  principal: ConversationsTraceI18nKey.TagPrincipal,
  response: ConversationsTraceI18nKey.TagResponse,
  'token-usage': ConversationsTraceI18nKey.TagTokenUsage,
  cost: ConversationsTraceI18nKey.TagCost,
  performance: ConversationsTraceI18nKey.TagPerformance,
  deployment: ConversationsTraceI18nKey.TagDeployment,
  insight: ConversationsTraceI18nKey.TagInsight,
  provenance: ConversationsTraceI18nKey.TagProvenance,
};

export const CONVERSATION_FIELD_VALUE_TYPE: Partial<Record<ConversationsField, QueryValueType>> = {
  [ConversationsField.ChatId]: QueryValueType.String,
  [ConversationsField.ProjectId]: QueryValueType.String,
  [ConversationsField.UserHash]: QueryValueType.String,
  [ConversationsField.TurnCount]: QueryValueType.Integer,
  [ConversationsField.TotalTokens]: QueryValueType.Integer,
  [ConversationsField.TotalPrice]: QueryValueType.Decimal,
  [ConversationsField.LastRequestTime]: QueryValueType.Timestamp,
  [ConversationsField.FirstRequestTime]: QueryValueType.Timestamp,
  [ConversationsField.InsightTitle]: QueryValueType.String,
  [ConversationsField.InsightTopics]: QueryValueType.String,
  [ConversationsField.InsightTruncated]: QueryValueType.Boolean,
};

export const CONVERSATION_FILTER_QUERY_OPERATOR: Record<
  Exclude<ConversationFilterOperator, ConversationFilterOperator.Range>,
  QueryOperator
> = {
  [ConversationFilterOperator.Contains]: QueryOperator.Ico,
  [ConversationFilterOperator.NotContains]: QueryOperator.Inc,
  [ConversationFilterOperator.Equals]: QueryOperator.Eq,
  [ConversationFilterOperator.NotEquals]: QueryOperator.Ne,
  [ConversationFilterOperator.GreaterThan]: QueryOperator.Gt,
  [ConversationFilterOperator.GreaterThanOrEqual]: QueryOperator.Ge,
  [ConversationFilterOperator.LessThan]: QueryOperator.Lt,
  [ConversationFilterOperator.LessThanOrEqual]: QueryOperator.Le,
};

export const GRID_FILTER_TYPE_OPERATOR: Record<GridFilterType, ConversationFilterOperator> = {
  [GridFilterType.CONTAINS]: ConversationFilterOperator.Contains,
  [GridFilterType.NOT_CONTAINS]: ConversationFilterOperator.NotContains,
  [GridFilterType.EQUALS]: ConversationFilterOperator.Equals,
  [GridFilterType.NOT_EQUAL]: ConversationFilterOperator.NotEquals,
  [GridFilterType.GREATER_THAN]: ConversationFilterOperator.GreaterThan,
  [GridFilterType.GREATER_THAN_OR_EQUAL]: ConversationFilterOperator.GreaterThanOrEqual,
  [GridFilterType.LESS_THAN]: ConversationFilterOperator.LessThan,
  [GridFilterType.LESS_THAN_OR_EQUAL]: ConversationFilterOperator.LessThanOrEqual,
};

// One colour per origin, from theme tokens. Every value here clears WCAG AA for normal text against
// `bg-layer-1` through `bg-layer-4`, which the grid's header row and the detail rail both draw on:
// accent-primary 7.8:1 → 5.7:1, accent-secondary 8.1:1 → 5.9:1, warning 11.7:1 → 8.6:1. `accent-tertiary`
// is the unused accent and would have been the obvious third hue, but it reads 4.32:1 on `bg-layer-4` —
// under the 4.5:1 floor for the 12px semibold the group header uses.
// An unnamed enrichment takes `text-secondary` (7.8:1 → 5.7:1) rather than a fourth hue: sharing a colour
// with a named origin would say the two are the same source.
export const PROVENANCE_TEXT_CLASS: Record<ColumnProvenance, string> = {
  [ColumnProvenance.Conversations]: 'text-accent-primary',
  [ColumnProvenance.Insights]: 'text-accent-secondary',
  [ColumnProvenance.Feedback]: 'text-warning',
  [ColumnProvenance.Other]: 'text-secondary',
};

export const COST_TEXT_CLASS = 'text-accent-secondary';

export const SPAN_CATEGORY_CLASS: Record<SpanCategory, string> = {
  [SpanCategory.Error]: 'bg-error text-error',
  [SpanCategory.Embedding]: 'bg-accent-secondary-alpha text-accent-secondary',
  [SpanCategory.Retrieval]: 'bg-accent-tertiary-alpha text-accent-tertiary',
  [SpanCategory.Route]: 'bg-accent-primary-alpha text-accent-primary',
  [SpanCategory.Deployment]: 'bg-info text-info',
  [SpanCategory.Other]: 'bg-layer-4 text-secondary',
};

export const EMPTY_ICON_SIZE = 24;

export const HOP_EVENT_RAIL_CLASS: Record<HopEventType, string> = {
  [HopEventType.TurnStart]: 'bg-accent-primary',
  [HopEventType.TurnComplete]: 'bg-accent-primary',
  [HopEventType.Text]: 'bg-accent-secondary',
  [HopEventType.ToolCall]: 'bg-accent-tertiary',
  [HopEventType.ToolResult]: 'bg-accent-tertiary',
  [HopEventType.Thinking]: 'bg-controls-accent',
  [HopEventType.Empty]: 'bg-layer-4',
  [HopEventType.Error]: 'bg-error',
  [HopEventType.Session]: 'bg-secondary',
  [HopEventType.Embedding]: 'bg-info',
  [HopEventType.Other]: 'bg-layer-4',
};

export const HOP_EVENT_LABEL_KEY: Record<HopEventType, string> = {
  [HopEventType.TurnStart]: ConversationsTraceI18nKey.EventTurnStart,
  [HopEventType.TurnComplete]: ConversationsTraceI18nKey.EventTurnComplete,
  [HopEventType.Text]: ConversationsTraceI18nKey.EventText,
  [HopEventType.ToolCall]: ConversationsTraceI18nKey.EventToolCall,
  [HopEventType.ToolResult]: ConversationsTraceI18nKey.EventToolResult,
  [HopEventType.Thinking]: ConversationsTraceI18nKey.EventThinking,
  [HopEventType.Empty]: ConversationsTraceI18nKey.EventEmpty,
  [HopEventType.Error]: ConversationsTraceI18nKey.EventError,
  [HopEventType.Session]: ConversationsTraceI18nKey.EventSession,
  [HopEventType.Embedding]: ConversationsTraceI18nKey.EventEmbedding,
  [HopEventType.Other]: ConversationsTraceI18nKey.EventOther,
};

export const SPAN_CATEGORY_RAIL_CLASS: Record<SpanCategory, string> = {
  [SpanCategory.Error]: 'bg-error',
  [SpanCategory.Embedding]: 'bg-accent-secondary',
  [SpanCategory.Retrieval]: 'bg-accent-tertiary',
  [SpanCategory.Route]: 'bg-accent-primary',
  [SpanCategory.Deployment]: 'bg-info',
  [SpanCategory.Other]: 'bg-layer-4',
};

export const SPAN_CATEGORY_LABEL_KEY: Record<SpanCategory, string> = {
  [SpanCategory.Error]: ConversationsTraceI18nKey.SpanError,
  [SpanCategory.Embedding]: ConversationsTraceI18nKey.SpanEmbedding,
  [SpanCategory.Retrieval]: ConversationsTraceI18nKey.SpanRetrieval,
  [SpanCategory.Route]: ConversationsTraceI18nKey.SpanRoute,
  [SpanCategory.Deployment]: ConversationsTraceI18nKey.SpanDeployment,
  [SpanCategory.Other]: ConversationsTraceI18nKey.SpanOther,
};

export const UNAVAILABLE_VALUE = '—';

export const CONVERSATION_FEEDBACK_LIMIT = 100;

export const CONVERSATION_DETAIL_PANELS: ConversationPanelDefinition[] = [
  {
    panel: ConversationDetailPanel.Usage,
    provenance: ColumnProvenance.Conversations,
    labelKey: ConversationsTraceI18nKey.DetailPanelUsage,
    layout: ConversationPanelLayout.Grid,
    fields: [
      {
        labelKey: ConversationsTraceI18nKey.DetailTokensIn,
        column: ConversationsField.PromptTokens,
        format: ConversationFieldFormat.Count,
      },
      {
        labelKey: ConversationsTraceI18nKey.DetailTokensOut,
        column: ConversationsField.CompletionTokens,
        format: ConversationFieldFormat.Count,
      },
      {
        labelKey: ConversationsTraceI18nKey.DetailTotalTokens,
        column: ConversationsField.TotalTokens,
        format: ConversationFieldFormat.Count,
      },
      {
        labelKey: ConversationsTraceI18nKey.Cost,
        column: ConversationsField.TotalPrice,
        format: ConversationFieldFormat.Cost,
        accentClassName: COST_TEXT_CLASS,
      },
      // Both figures are wrong in their own way, so each states its own caveat rather than sharing one: a
      // note naming only the sum would leave the average looking sound. The grid's Duration column used to
      // carry the first of these; it no longer exists, and these are the only surfaces left showing either.
      {
        labelKey: ConversationsTraceI18nKey.DetailDuration,
        column: ConversationsField.DurationMs,
        format: ConversationFieldFormat.Duration,
        hintKey: ConversationsTraceI18nKey.DurationHint,
      },
      {
        labelKey: ConversationsTraceI18nKey.DetailAvgDuration,
        column: ConversationsField.AvgDurationMs,
        format: ConversationFieldFormat.Duration,
        hintKey: ConversationsTraceI18nKey.AvgDurationHint,
      },
    ],
  },
  {
    panel: ConversationDetailPanel.Metadata,
    provenance: ColumnProvenance.Conversations,
    labelKey: ConversationsTraceI18nKey.DetailPanelMetadata,
    layout: ConversationPanelLayout.Rows,
    fields: [
      { labelKey: ConversationsTraceI18nKey.Conversation, column: ConversationsField.ChatId },
      { labelKey: ConversationsTraceI18nKey.DetailUser, column: ConversationsField.UserHash },
      { labelKey: ConversationsTraceI18nKey.Project, column: ConversationsField.ProjectId },
      {
        labelKey: ConversationsTraceI18nKey.DetailStarted,
        column: ConversationsField.FirstRequestTime,
        format: ConversationFieldFormat.DateTime,
      },
      {
        labelKey: ConversationsTraceI18nKey.DetailSuccessful,
        column: ConversationsField.SuccessCount,
        format: ConversationFieldFormat.Count,
      },
      {
        labelKey: ConversationsTraceI18nKey.DetailTrace,
        column: ConversationsField.Traces,
        format: ConversationFieldFormat.List,
      },
      {
        labelKey: ConversationsTraceI18nKey.DetailDeployment,
        column: ConversationsField.Deployments,
        format: ConversationFieldFormat.List,
      },
    ],
  },
];

export const CONVERSATION_SOURCE_ENTITIES: ProvenanceEntity[] = [
  { provenance: ColumnProvenance.Conversations, name: CONVERSATIONS_ENTITY },
  { provenance: ColumnProvenance.Feedback, name: FEEDBACK_ENTITY },
];

// Columns whose origin cannot be read off a field name, because they have no field of this entity: Rating is
// composed from the `rate_analytics` lookups.
export const COMPOSED_COLUMN_PROVENANCE: Record<string, ColumnProvenance> = {
  [ConversationColumn.Rating]: ColumnProvenance.Feedback,
};

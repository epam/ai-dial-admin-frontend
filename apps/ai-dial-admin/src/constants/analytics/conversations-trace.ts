import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import {
  ColumnProvenance,
  ConversationArrayValueSource,
  ConversationColumn,
  ConversationDetailPanel,
  ConversationFieldDefinition,
  ConversationFieldFormat,
  ConversationFilterOperator,
  ConversationInsightsState,
  ConversationPanelDefinition,
  ConversationPanelFrame,
  ConversationPanelLayout,
  ConversationScalarOperator,
  ConversationsField,
  HopEventType,
  ProvenanceEntity,
  ResponseRatingsField,
  SpanKind,
  UsageLogField,
} from '@/src/models/analytics/conversations-trace';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryOperator, QueryValueType } from '@/src/models/analytics/query';
import { GridFilterType } from '@/src/types/grid-filter';

export const CONVERSATIONS_ENTITY = 'sessions';

export const FEEDBACK_ENTITY = 'response_ratings';

export const USAGE_LOG_ENTITY = 'dial_usage_log';

// The rollup's `client_session_source` value meaning "this id came from a conversation header". Every other
// value names a coding-harness header, whose hops carry no `chat_id`.
export const CHAT_ID_SESSION_SOURCE = 'chat_id';

export const CONVERSATION_ENTRY_HOP_LIMIT = 200;

export const CONVERSATION_SPAN_LIMIT = 300;

export const CONVERSATION_TRACE_PAGE_SIZE = 50;

// A guard against the unlabelled batch shape, not against chat traffic: chat traces record one client root
// and at most one Core-internal root, while one measured trace carried 93 roots. Reaching the cap is
// disclosed rather than truncated, because the trace's own figures are not capped with it.
export const CONVERSATION_TRACE_ROOT_CAP = 12;

// `dial_usage_log` is `PARTITION BY toYYYYMMDD(request_time)`, so widening a bound to a whole UTC day is
// nearly free — and one further day of slack is what the bound actually needs. A root span starts before its
// children (54–502 ms observed, no upper bound) and a Core-internal root fires when its parent completes
// (36 s later on one trace), so a bound rounded to the *containing* day has zero margin at exactly the
// boundary those offsets straddle.
export const CONVERSATION_DAY_PAD_MS = 24 * 60 * 60 * 1000;

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

export const LLM_CALL_EVENT_KIND = 'llm_call';

export const EMBEDDING_EVENT_KIND = 'embedding';

export const STREAM_MODEL_BODY_LIMIT = 80;

export const STREAM_MODEL_BODY_BYTE_BUDGET = 24 * 1024 * 1024;

export const TOOL_ARGUMENTS_PREVIEW_LIMIT = 200;

// The inspector's clamps. Kept together and beside `STREAM_MODEL_BODY_BYTE_BUDGET` because they are one
// tuning surface: the recorded distribution is bimodal — 63% of model-call requests are under 10 KB while 21%
// exceed 100 KB — so these are the numbers that decide how the heavy tail degrades.
export const MESSAGE_TEXT_CLAMP = 280;

// At or above this, a message is marked: on a 100 KB request, which message made it so is the first thing a
// reader wants.
export const LARGE_MESSAGE_BYTES = 1024;

// A per-message clamp alone does not bound the envelope: the messages dialect averages 56.6 messages, and
// clamped individually they still assemble into more than the rail will show.
export const ENVELOPE_BYTE_BUDGET = 256 * 1024;

export const RAW_BODY_BYTE_BUDGET = 512 * 1024;

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

export const RATING_COUNT_EXCLUSIVE_MIN = 0;

export const OPTIONAL_FEEDBACK_FIELDS: ResponseRatingsField[] = [ResponseRatingsField.CommentSample];

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

export const DETAIL_INSIGHT_FIELDS: ConversationsField[] = [
  ConversationsField.InsightSummary,
  ConversationsField.InsightSentiment,
  ConversationsField.InsightTopic,
  ConversationsField.InsightLanguage,
  ConversationsField.InsightResolutionStatus,
  ConversationsField.InsightActivityType,
  ConversationsField.InsightActivitySubTaskType,
];

export const OPTIONAL_DETAIL_SELECT_FIELDS: ConversationsField[] = [
  ...OPTIONAL_CURATED_COLUMN_FIELDS,
  ...IDENTITY_ENRICHMENT_FIELDS,
  ...DETAIL_INSIGHT_FIELDS,
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

// Membership in this map is the test for "this column's filter needs the resolution step" — a scalar column
// has no entry and takes the ordinary predicate path.
//
// `sessions.deployments` is built from usage-log hops, so the hop log's scalar `deployment` column holds
// exactly the names the array can carry. The entity's other array columns (`traces`, `client_types`,
// `auth_types`, `user_refs`) have no column in the grid today; the mechanism is generic and they can be
// added here when they do.
export const CONVERSATION_ARRAY_VALUE_SOURCE: Partial<Record<ConversationsField, ConversationArrayValueSource>> = {
  [ConversationsField.Deployments]: {
    entity: USAGE_LOG_ENTITY,
    field: UsageLogField.Deployment,
    timeField: UsageLogField.RequestTime,
  },
};

// The service's own row ceiling: a query naming no page gets a default of 100 rows, and a requested limit
// above 1000 is rejected rather than clamped. So a resolution that must not be truncated is a loop over
// pages of exactly this size — two of them for the 1092 distinct deployment names a measured instance
// carries — ending on the first page that comes back short.
export const ARRAY_VALUE_PAGE_SIZE = 1000;

// A guard against a service that ignores the offset, not against the data: the resolved set is bounded by
// how many distinct values the column holds, so the loop should end on its second page today.
export const ARRAY_VALUE_PAGE_CAP = 10;

export const CONVERSATION_FIELD_VALUE_COUNT_ALIAS = 'value_count';

// Bound by name rather than by reference so the column catalog — a pure util, read by the server actions
// too — does not import a client component to describe a column.
export const CONVERSATION_VALUE_FILTER = 'conversationValueFilter';

// A bound on the grouped count that discovers an enum's values, not a cap on a filter's meaning: an enum's
// value set is closed and small (twenty-two on the widest field of the current schema), so this is only
// reached by a field the service has typed `enum` when it is not one — where a truncated list is a better
// outcome than a menu of thousands.
export const CONVERSATION_FIELD_VALUE_LIMIT = 200;

// `last_request_time` is deliberately absent: the toolbar's period control already predicates on it, and a
// second control over the same axis would let a filter appear to widen a range the period clips.
//
// `deployments` is here even though the query language has no comparison operator over an array: a contains
// filter is answered by resolving the entered text against `CONVERSATION_ARRAY_VALUE_SOURCE` first. Ordering
// an array is still not expressible, which is why it is absent from the sortable set above.
export const FILTERABLE_CONVERSATION_FIELDS: ConversationsField[] = [
  ConversationsField.ChatId,
  ConversationsField.ProjectId,
  ConversationsField.UserHash,
  ConversationsField.TurnCount,
  ConversationsField.TotalTokens,
  ConversationsField.TotalPrice,
  ConversationsField.Deployments,
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
  [AnalyticsFieldType.Enum]: QueryValueType.String,
  [AnalyticsFieldType.Integer]: QueryValueType.Integer,
  [AnalyticsFieldType.Long]: QueryValueType.Long,
  [AnalyticsFieldType.Decimal]: QueryValueType.Decimal,
  [AnalyticsFieldType.Boolean]: QueryValueType.Boolean,
  [AnalyticsFieldType.Date]: QueryValueType.Date,
  [AnalyticsFieldType.Timestamp]: QueryValueType.Timestamp,
};

export const ENRICHMENT_PROVENANCE: Record<string, ColumnProvenance> = {
  session_insights: ColumnProvenance.Insights,
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

// The type of a *value* compared against the field. For an array column that is its element type: the
// predicate is a membership test over the elements, never a comparison against the array itself.
export const CONVERSATION_FIELD_VALUE_TYPE: Partial<Record<ConversationsField, QueryValueType>> = {
  [ConversationsField.ChatId]: QueryValueType.String,
  [ConversationsField.Deployments]: QueryValueType.String,
  [ConversationsField.ProjectId]: QueryValueType.String,
  [ConversationsField.UserHash]: QueryValueType.String,
  [ConversationsField.TurnCount]: QueryValueType.Integer,
  [ConversationsField.TotalTokens]: QueryValueType.Integer,
  [ConversationsField.TotalPrice]: QueryValueType.Decimal,
  [ConversationsField.LastRequestTime]: QueryValueType.Timestamp,
  [ConversationsField.FirstRequestTime]: QueryValueType.Timestamp,
  [ConversationsField.InsightTitle]: QueryValueType.String,
  [ConversationsField.InsightSummary]: QueryValueType.String,
  [ConversationsField.InsightSentiment]: QueryValueType.String,
  [ConversationsField.InsightTopic]: QueryValueType.String,
  [ConversationsField.InsightTopics]: QueryValueType.String,
  [ConversationsField.InsightLanguage]: QueryValueType.String,
  [ConversationsField.InsightResolutionStatus]: QueryValueType.String,
  [ConversationsField.InsightActivityType]: QueryValueType.String,
  [ConversationsField.InsightActivitySubTaskType]: QueryValueType.String,
};

export const CONVERSATION_FILTER_QUERY_OPERATOR: Record<
  Exclude<ConversationFilterOperator, ConversationFilterOperator.Range>,
  QueryOperator
> = {
  [ConversationFilterOperator.In]: QueryOperator.In,
  [ConversationFilterOperator.Contains]: QueryOperator.Ico,
  [ConversationFilterOperator.NotContains]: QueryOperator.Inc,
  [ConversationFilterOperator.Equals]: QueryOperator.Eq,
  [ConversationFilterOperator.NotEquals]: QueryOperator.Ne,
  [ConversationFilterOperator.GreaterThan]: QueryOperator.Gt,
  [ConversationFilterOperator.GreaterThanOrEqual]: QueryOperator.Ge,
  [ConversationFilterOperator.LessThan]: QueryOperator.Lt,
  [ConversationFilterOperator.LessThanOrEqual]: QueryOperator.Le,
};

export const GRID_FILTER_TYPE_OPERATOR: Record<GridFilterType, ConversationScalarOperator> = {
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

// Which node a kind corresponds to in the tree. The tree owns the palette: colour does real work there —
// matching a filter control to the nodes it marks — so the rail derives its badge hue from it rather than
// keeping a second set. A hop reading `accent-primary` in the tree must not read blue in the rail beside it.
export const SPAN_KIND_EVENT_TYPE: Record<SpanKind, HopEventType> = {
  [SpanKind.Llm]: HopEventType.ModelCall,
  [SpanKind.Mcp]: HopEventType.ToolResult,
  [SpanKind.Embeddings]: HopEventType.Embedding,
  // `route` hops are excluded from the tree entirely, so this kind has no node to correspond to and takes the
  // neutral hue rather than borrowing one that already means something else.
  [SpanKind.Route]: HopEventType.Other,
  [SpanKind.Other]: HopEventType.Other,
};

// Filled rather than outlined — a rail badge is not a filter control — but the same hue as the kind's node.
export const SPAN_KIND_CLASS: Record<SpanKind, string> = {
  [SpanKind.Llm]: 'bg-accent-primary-alpha text-accent-primary',
  [SpanKind.Mcp]: 'bg-accent-tertiary-alpha text-accent-tertiary',
  [SpanKind.Embeddings]: 'bg-warning text-warning',
  [SpanKind.Route]: 'bg-layer-4 text-secondary',
  [SpanKind.Other]: 'bg-layer-4 text-secondary',
};

// Failure is its own axis, so it has its own class rather than a member of the kind palette.
export const SPAN_FAILED_CLASS = 'bg-error text-error';

export const CONVERSATION_INSIGHT_FIELDS: ConversationFieldDefinition[] = [
  { labelKey: ConversationsTraceI18nKey.DetailSummary, column: ConversationsField.InsightSummary },
  { labelKey: ConversationsTraceI18nKey.DetailSentiment, column: ConversationsField.InsightSentiment },
  {
    labelKey: ConversationsTraceI18nKey.DetailResolutionStatus,
    column: ConversationsField.InsightResolutionStatus,
  },
  { labelKey: ConversationsTraceI18nKey.DetailTopic, column: ConversationsField.InsightTopic },
  { labelKey: ConversationsTraceI18nKey.DetailTopics, column: ConversationsField.InsightTopics },
  { labelKey: ConversationsTraceI18nKey.DetailLanguage, column: ConversationsField.InsightLanguage },
  { labelKey: ConversationsTraceI18nKey.DetailActivityType, column: ConversationsField.InsightActivityType },
  {
    labelKey: ConversationsTraceI18nKey.DetailActivitySubTaskType,
    column: ConversationsField.InsightActivitySubTaskType,
  },
];

export const INSIGHTS_ABSENCE_KEY: Record<
  Exclude<ConversationInsightsState, ConversationInsightsState.Available>,
  string
> = {
  [ConversationInsightsState.NotEvaluated]: ConversationsTraceI18nKey.DetailInsightsNotEvaluated,
  [ConversationInsightsState.EnrichmentUnavailable]: ConversationsTraceI18nKey.DetailInsightsUnavailable,
};

export const INSIGHT_BADGE_NEUTRAL_CLASS = 'bg-layer-4 text-secondary';

export const SENTIMENT_BADGE_CLASS: Record<string, string> = {
  positive: 'bg-success text-success',
  neutral: 'bg-info text-info',
  negative: 'bg-error text-error',
  mixed: 'bg-warning text-warning',
};

export const RESOLUTION_BADGE_CLASS: Record<string, string> = {
  resolved: 'bg-success text-success',
  partially_resolved: 'bg-warning text-warning',
  unresolved: 'bg-error text-error',
  abandoned: 'bg-error text-error',
  unclear: 'bg-layer-4 text-secondary',
};

export const EMPTY_ICON_SIZE = 24;

export const HOP_EVENT_RAIL_CLASS: Record<HopEventType, string> = {
  [HopEventType.ModelCall]: 'border-accent-primary',
  [HopEventType.Text]: 'border-accent-secondary',
  [HopEventType.ToolCall]: 'border-accent-tertiary',
  [HopEventType.ToolResult]: 'border-accent-tertiary',
  [HopEventType.Thinking]: 'border-accent-secondary',
  [HopEventType.Empty]: 'border-primary',
  [HopEventType.Session]: 'border-primary',
  [HopEventType.Embedding]: 'border-warning',
  [HopEventType.Other]: 'border-primary',
};

export const HOP_EVENT_CHIP_CLASS: Record<HopEventType, string> = {
  [HopEventType.ModelCall]: 'border-accent-primary text-accent-primary',
  [HopEventType.Text]: 'border-accent-secondary text-accent-secondary',
  [HopEventType.ToolCall]: 'border-accent-tertiary text-accent-tertiary',
  [HopEventType.ToolResult]: 'border-accent-tertiary text-accent-tertiary',
  [HopEventType.Thinking]: 'border-accent-secondary text-accent-secondary',
  [HopEventType.Empty]: 'border-primary text-secondary',
  [HopEventType.Session]: 'border-primary text-secondary',
  [HopEventType.Embedding]: 'border-warning text-warning',
  [HopEventType.Other]: 'border-primary text-secondary',
};

export const NEUTRAL_CHIP_CLASS = 'border-primary text-secondary';

// The outcome axis carries its own colour rather than borrowing one from the kind palette, so a failure reads
// as a failure whatever kind of call it happened to.
export const HOP_FAILED_RAIL_CLASS = 'border-error';

export const HOP_FAILED_CHIP_CLASS = 'border-error text-error';

export const UNRECORDED_ROOT_RAIL_CLASS = 'border-primary';

export const TREE_GUIDE_CLASS = 'border-primary';

export const FILTERABLE_EVENT_TYPES: HopEventType[] = [
  HopEventType.ModelCall,
  HopEventType.Text,
  HopEventType.ToolCall,
  HopEventType.ToolResult,
  HopEventType.Thinking,
  HopEventType.Empty,
  HopEventType.Session,
  HopEventType.Embedding,
  HopEventType.Other,
];

export const HOP_EVENT_LABEL_KEY: Record<HopEventType, string> = {
  [HopEventType.ModelCall]: ConversationsTraceI18nKey.EventModelCall,
  [HopEventType.Text]: ConversationsTraceI18nKey.EventText,
  [HopEventType.ToolCall]: ConversationsTraceI18nKey.EventToolCall,
  [HopEventType.ToolResult]: ConversationsTraceI18nKey.EventToolResult,
  [HopEventType.Thinking]: ConversationsTraceI18nKey.EventThinking,
  [HopEventType.Empty]: ConversationsTraceI18nKey.EventEmpty,
  [HopEventType.Session]: ConversationsTraceI18nKey.EventSession,
  [HopEventType.Embedding]: ConversationsTraceI18nKey.EventEmbedding,
  [HopEventType.Other]: ConversationsTraceI18nKey.EventOther,
};

export const SPAN_KIND_LABEL_KEY: Record<SpanKind, string> = {
  [SpanKind.Embeddings]: ConversationsTraceI18nKey.SpanEmbeddings,
  [SpanKind.Mcp]: ConversationsTraceI18nKey.SpanMcp,
  [SpanKind.Route]: ConversationsTraceI18nKey.SpanRoute,
  [SpanKind.Llm]: ConversationsTraceI18nKey.SpanLlm,
  [SpanKind.Other]: ConversationsTraceI18nKey.SpanOther,
};

export const UNAVAILABLE_VALUE = '—';

export const CONVERSATION_FEEDBACK_LIMIT = 100;

export const CONVERSATION_INSIGHTS_PANEL: ConversationPanelFrame = {
  panel: ConversationDetailPanel.Insights,
  sourceEntity: CONVERSATIONS_ENTITY,
  provenance: ColumnProvenance.Insights,
  labelKey: ConversationsTraceI18nKey.DetailPanelInsights,
};

export const CONVERSATION_FEEDBACK_PANEL: ConversationPanelFrame = {
  panel: ConversationDetailPanel.Feedback,
  sourceEntity: FEEDBACK_ENTITY,
  provenance: ColumnProvenance.Feedback,
  labelKey: ConversationsTraceI18nKey.DetailPanelFeedback,
};

export const CONVERSATION_DETAIL_PANELS: ConversationPanelDefinition[] = [
  {
    panel: ConversationDetailPanel.Usage,
    sourceEntity: CONVERSATIONS_ENTITY,
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
    sourceEntity: CONVERSATIONS_ENTITY,
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

export const QUERIED_SOURCE_ENTITIES: ProvenanceEntity[] = [
  { provenance: ColumnProvenance.Feedback, name: FEEDBACK_ENTITY },
];

// Columns whose origin cannot be read off a field name, because they have no field of this entity: Rating is
// composed from the rating rollup's lookups.
export const COMPOSED_COLUMN_PROVENANCE: Record<string, ColumnProvenance> = {
  [ConversationColumn.Rating]: ColumnProvenance.Feedback,
};

import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import {
  ColumnProvenance,
  SessionArrayValueSource,
  SessionColumn,
  SessionDetailPanel,
  SessionFieldFormat,
  SessionFilterOperator,
  SessionInsightsState,
  SessionPanelDefinition,
  SessionPanelFrame,
  SessionPanelLayout,
  SessionScalarOperator,
  SessionsField,
  MessageRole,
  ProvenanceEntity,
  ResponseRatingsField,
  SpanFieldTag,
  SpanKind,
  UsageLogField,
} from '@/src/models/analytics/sessions-trace';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryOperator, QueryValueType } from '@/src/models/analytics/query';
import { GridFilterType } from '@/src/types/grid-filter';

export const SESSIONS_ENTITY = 'sessions';

export const FEEDBACK_ENTITY = 'response_ratings';

export const USAGE_LOG_ENTITY = 'dial_usage_log';

// The namespace the `sessions` entity exposes its session-insight columns under. Named once: the detail
// query selects by it, the panel's field set is derived from it, and the provenance map is keyed on it, so
// the three cannot disagree about what counts as an insight column.
export const INSIGHTS_ENRICHMENT = 'session_insights';

// The rollup's `client_session_source` value meaning "this id came from a session header". Every other
// value names a coding-harness header, whose hops carry no `chat_id`.
export const CHAT_ID_SESSION_SOURCE = 'chat_id';

export const SESSION_SPAN_LIMIT = 300;

export const SESSION_TRACE_PAGE_SIZE = 50;

// A guard against the unlabelled batch shape, not against chat traffic: chat traces record one client root
// and at most one Core-internal root, while one measured trace carried 93 roots. Reaching the cap is
// disclosed rather than truncated, because the trace's own figures are not capped with it.
export const SESSION_TRACE_ROOT_CAP = 12;

// `dial_usage_log` is `PARTITION BY toYYYYMMDD(request_time)`, so widening a bound to a whole UTC day is
// nearly free — and one further day of slack is what the bound actually needs. A root span starts before its
// children (54–502 ms observed, no upper bound) and a Core-internal root fires when its parent completes
// (36 s later on one trace), so a bound rounded to the *containing* day has zero margin at exactly the
// boundary those offsets straddle.
export const SESSION_DAY_PAD_MS = 24 * 60 * 60 * 1000;

export const USAGE_LOG_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;

// The protocol's own phrases, not prose this console writes: constants rather than translated strings. Only
// the codes the hop log records are named; anything else states its number alone rather than a guess.
export const HTTP_REASON_PHRASE: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  204: 'No Content',
  206: 'Partial Content',
  304: 'Not Modified',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  408: 'Request Timeout',
  409: 'Conflict',
  413: 'Content Too Large',
  422: 'Unprocessable Content',
  424: 'Failed Dependency',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};

export const MCP_NOTIFICATION_PREFIX = 'notifications/';

// The rating endpoint. A rating records no `event_kind`, so its endpoint is the only thing that identifies
// it — the same signal an unlabelled model call is classified by. Anchored at the end of the path because the
// deployment name sits in the middle of it.
export const RATE_URI_SUFFIX = '/rate';

export const ROUTE_EVENT_KIND = 'route';

export const MCP_EVENT_KIND = 'mcp';

export const LLM_CALL_EVENT_KIND = 'llm_call';

export const EMBEDDING_EVENT_KIND = 'embedding';

// The inspector's clamps, one tuning surface: the recorded distribution is bimodal — 63% of model-call
// requests are under 10 KB while 21% exceed 100 KB — so these are the numbers that decide how the heavy tail
// degrades.
export const MESSAGE_TEXT_CLAMP = 280;

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

// Both body columns are named only when the fetched schema reports them: an instance can persist the
// assembled column without `response_body`, or the reverse, and one unknown field rejects the whole query.
export const OPTIONAL_USAGE_LOG_FIELDS: UsageLogField[] = [UsageLogField.AssembledResponse, UsageLogField.ResponseBody];

// Selected whatever the schema reports, because the tree, the transport line and the span's own badges are
// built from them: dropping one after a failed schema read would cost the reader the hop chain.
//
// Every member MUST be a column the service publishes to **any** caller. A `sensitive` column here is absent
// from a non-administrator's query model, and naming an absent column rejects the whole query — so the trace
// would open empty for everyone but a full administrator. The sensitive gate fails open on a stack running
// with security disabled, so a non-administrator cannot be reproduced locally; `span-fields.spec.ts` asserts
// the invariant instead.
export const SPAN_BASE_FIELDS: UsageLogField[] = [
  UsageLogField.CoreSpanId,
  UsageLogField.CoreParentSpanId,
  UsageLogField.EventKind,
  UsageLogField.Deployment,
  UsageLogField.ParentDeployment,
  UsageLogField.RequestMethod,
  UsageLogField.RequestUri,
  UsageLogField.ResponseUpstreamUri,
  UsageLogField.ResponseStatus,
  UsageLogField.Success,
  UsageLogField.OperationDurationMs,
  UsageLogField.TotalTokens,
  UsageLogField.DeploymentPrice,
  UsageLogField.TotalPrice,
  UsageLogField.RequestTime,
  UsageLogField.ResponseBodyBytes,
  UsageLogField.RequestBodyBytes,
  UsageLogField.NumberRequestMessages,
  UsageLogField.ReasoningTokens,
  UsageLogField.McpMethod,
  UsageLogField.McpToolCallName,
  UsageLogField.ExecutionPath,
];

// The one column the groups drop: the baggage table's copy of the request time is non-nullable, so an event
// with no baggage row reads it as the epoch — `1970-01-01` under a label saying "request time" reads as a bug
// in this console. Excluded by its full name, because the hop log's own `request_time` is a different column
// that the rail does state.
export const SPAN_UNREADABLE_FIELDS: string[] = ['usage_request_baggage.request_time'];

// The service returns untagged fields last, so this group lands last by arrival order without being ordered
// here.
export const UNTAGGED_SPAN_FIELD_TAG = 'other';

// Money, whatever the schema types it as: a cost column is `decimal` and runs well below the cent, so it
// reads through the cost formatter — `toLocaleString` keeps three decimals and would state $0.0000075 as 0.
export const SPAN_COST_TAGS: string[] = [SpanFieldTag.Cost];

// The tags whose zero means "not reported" rather than "measured none". Keyed by tag rather than by column
// name, so a metered column this frontend has not seen yet is covered too — and a zero on a request-message
// count stays the real count it is.
export const SPAN_METERED_TAGS: string[] = [SpanFieldTag.TokenUsage, SpanFieldTag.Cost, SpanFieldTag.Performance];

export const SPAN_FIELD_TAG_LABEL_KEY: Record<string, string> = {
  [SpanFieldTag.Identifier]: SessionsTraceI18nKey.SpanTagIdentifier,
  [SpanFieldTag.Dimension]: SessionsTraceI18nKey.SpanTagDimension,
  [SpanFieldTag.Principal]: SessionsTraceI18nKey.SpanTagPrincipal,
  [SpanFieldTag.Deployment]: SessionsTraceI18nKey.SpanTagDeployment,
  [SpanFieldTag.Request]: SessionsTraceI18nKey.SpanTagRequest,
  [SpanFieldTag.Response]: SessionsTraceI18nKey.SpanTagResponse,
  [SpanFieldTag.TokenUsage]: SessionsTraceI18nKey.SpanTagTokenUsage,
  [SpanFieldTag.Cost]: SessionsTraceI18nKey.SpanTagCost,
  [SpanFieldTag.Performance]: SessionsTraceI18nKey.SpanTagPerformance,
  [SpanFieldTag.Client]: SessionsTraceI18nKey.SpanTagClient,
  [SpanFieldTag.Provenance]: SessionsTraceI18nKey.SpanTagProvenance,
  [SpanFieldTag.Tracing]: SessionsTraceI18nKey.SpanTagTracing,
  [SpanFieldTag.System]: SessionsTraceI18nKey.SpanTagSystem,
  [UNTAGGED_SPAN_FIELD_TAG]: SessionsTraceI18nKey.SpanTagOther,
};

// The column a group is previewed by, where its own first field is the wrong answer. Fields arrive sorted by
// name inside a tag, so `token-usage` would otherwise lead with a cache count — a part of another figure —
// rather than with the hop's own total.
export const SPAN_GROUP_SUMMARY_FIELD: Record<string, UsageLogField> = {
  [SpanFieldTag.TokenUsage]: UsageLogField.TotalTokens,
  [SpanFieldTag.Performance]: UsageLogField.OperationDurationMs,
  [SpanFieldTag.Cost]: UsageLogField.TotalPrice,
  [SpanFieldTag.Request]: UsageLogField.RequestMethod,
  [SpanFieldTag.Response]: UsageLogField.ResponseStatus,
};

export const HOP_REQUEST_BODY_FIELD: UsageLogField = UsageLogField.RequestBody;

export const HOP_RESPONSE_BODY_FIELDS: UsageLogField[] = [UsageLogField.AssembledResponse, UsageLogField.ResponseBody];

export const FEEDBACK_CANDIDATE_LIMIT = 1000;

export const RATING_COUNT_EXCLUSIVE_MIN = 0;

export const OPTIONAL_FEEDBACK_FIELDS: ResponseRatingsField[] = [ResponseRatingsField.CommentSample];

export const SESSIONS_TIME_PERIOD = '7d';

export const SESSIONS_SEARCH_DEBOUNCE_MS = 400;

export const SESSIONS_ROW_HEIGHT = 64;

export const SESSIONS_GROUP_HEADER_HEIGHT = 32;

export const SESSIONS_HEADER_HEIGHT = 38;

export const SESSIONS_FLOATING_FILTER_HEIGHT = 38;

export const SESSIONS_HEADER_STACK_HEIGHT =
  SESSIONS_GROUP_HEADER_HEIGHT + SESSIONS_HEADER_HEIGHT + SESSIONS_FLOATING_FILTER_HEIGHT;

export const SESSIONS_STORAGE_KEY = 'analytics/sessions';

export const SUMMARY_COST_PRECISION = 3;

// Below a dollar, cost is rendered at significant digits; from a dollar up, rounded and abbreviated.
export const COST_COMPACT_THRESHOLD = 1;

export const COST_SIGNIFICANT_DIGITS = 2;

export const REQUIRED_DETAIL_SELECT_FIELDS: SessionsField[] = [
  SessionsField.ChatId,
  SessionsField.ProjectId,
  SessionsField.UserHash,
  SessionsField.TurnCount,
  SessionsField.FirstRequestTime,
  SessionsField.LastRequestTime,
  SessionsField.PromptTokens,
  SessionsField.CompletionTokens,
  SessionsField.TotalTokens,
  SessionsField.TotalPrice,
  SessionsField.SuccessCount,
  SessionsField.DurationMs,
  SessionsField.AvgDurationMs,
  SessionsField.Deployments,
];

// Fields beyond the view's original set that a curated column still reads. Each is a catalog object an
// instance may not carry yet, so a query names one only when the fetched schema reports it, and a curated
// column reading one is not rendered at all where it is absent.
export const OPTIONAL_CURATED_COLUMN_FIELDS: SessionsField[] = [SessionsField.InsightTopics];

// Enrichment-backed fields the identity column reads. Unlike every other enrichment field, these are not
// projected on column visibility: the column that reads them is the one column the view cannot hide, so
// the join is paid on every page. That is the cost of naming a session by anything other than its id.
export const IDENTITY_ENRICHMENT_FIELDS: SessionsField[] = [SessionsField.InsightTitle];

export const DETAIL_INSIGHT_FIELDS: SessionsField[] = [
  SessionsField.InsightSummary,
  SessionsField.InsightSentiment,
  SessionsField.InsightTopic,
  SessionsField.InsightLanguage,
  SessionsField.InsightResolutionStatus,
  SessionsField.InsightActivityType,
  SessionsField.InsightActivitySubTaskType,
];

export const OPTIONAL_DETAIL_SELECT_FIELDS: SessionsField[] = [
  ...OPTIONAL_CURATED_COLUMN_FIELDS,
  ...IDENTITY_ENRICHMENT_FIELDS,
  ...DETAIL_INSIGHT_FIELDS,
  SessionsField.Traces,
];

// Only where the query can order the whole result by the field: paging is server-side, so a sort the backend
// cannot express would reorder one loaded block and report a slice as the answer. `deployments` and `topics`
// are absent by design — the language expresses no ordering over an array, and a delimited string would sort
// by whichever term happens to be written first.
export const SORTABLE_SESSION_FIELDS: SessionsField[] = [
  SessionsField.ChatId,
  SessionsField.ProjectId,
  SessionsField.UserHash,
  SessionsField.TurnCount,
  SessionsField.LastRequestTime,
  SessionsField.TotalTokens,
  SessionsField.TotalPrice,
];

// Membership in this map is the test for "this column's filter needs the resolution step" — a scalar column
// has no entry and takes the ordinary predicate path.
//
// `sessions.deployments` is built from usage-log hops, so the hop log's scalar `deployment` column holds
// exactly the names the array can carry. The entity's other array columns (`traces`, `client_types`,
// `auth_types`, `user_refs`) have no column in the grid today; the mechanism is generic and they can be
// added here when they do.
export const SESSION_ARRAY_VALUE_SOURCE: Partial<Record<SessionsField, SessionArrayValueSource>> = {
  [SessionsField.Deployments]: {
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

export const SESSION_FIELD_VALUE_COUNT_ALIAS = 'value_count';

// Bound by name rather than by reference so the column catalog — a pure util, read by the server actions
// too — does not import a client component to describe a column.
export const SESSION_VALUE_FILTER = 'sessionValueFilter';
export const SESSION_VALUE_FLOATING_FILTER = 'sessionValueFloatingFilter';

// A bound on the grouped count that discovers an enum's values, not a cap on a filter's meaning: an enum's
// value set is closed and small (twenty-two on the widest field of the current schema), so this is only
// reached by a field the service has typed `enum` when it is not one — where a truncated list is a better
// outcome than a menu of thousands.
export const SESSION_FIELD_VALUE_LIMIT = 200;

// `last_request_time` is deliberately absent: the toolbar's period control already predicates on it, and a
// second control over the same axis would let a filter appear to widen a range the period clips.
//
// `deployments` is here even though the query language has no comparison operator over an array: a contains
// filter is answered by resolving the entered text against `SESSION_ARRAY_VALUE_SOURCE` first. Ordering
// an array is still not expressible, which is why it is absent from the sortable set above.
export const FILTERABLE_SESSION_FIELDS: SessionsField[] = [
  SessionsField.ChatId,
  SessionsField.ProjectId,
  SessionsField.UserHash,
  SessionsField.TurnCount,
  SessionsField.TotalTokens,
  SessionsField.TotalPrice,
  SessionsField.Deployments,
  SessionsField.InsightTopics,
];

export const CURATED_COMPOSED_FIELDS: string[] = [SessionsField.FirstRequestTime, ...IDENTITY_ENRICHMENT_FIELDS];

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
  [INSIGHTS_ENRICHMENT]: ColumnProvenance.Insights,
};

export const PROVENANCE_LABEL_KEY: Partial<Record<ColumnProvenance, string>> = {
  [ColumnProvenance.Sessions]: SessionsTraceI18nKey.ProvenanceSessions,
  [ColumnProvenance.Insights]: SessionsTraceI18nKey.ProvenanceInsights,
  [ColumnProvenance.Feedback]: SessionsTraceI18nKey.ProvenanceFeedback,
};

export const PROVENANCE_HINT_KEY: Record<ColumnProvenance, string> = {
  [ColumnProvenance.Sessions]: SessionsTraceI18nKey.ProvenanceSessionsHint,
  [ColumnProvenance.Insights]: SessionsTraceI18nKey.ProvenanceInsightsHint,
  [ColumnProvenance.Feedback]: SessionsTraceI18nKey.ProvenanceFeedbackHint,
  [ColumnProvenance.Other]: SessionsTraceI18nKey.ProvenanceEnrichmentHint,
};

// Readable names for the tags the service reports, because a header showing `token-usage` presents a catalog
// identifier where a reader needs words. A tag missing from here falls back to its raw value: an unlovely
// header, never a dropped column.
//
// `provenance` is the one entry doing real work. Its five fields are the evaluation's own bookkeeping, and
// one of them reports the display name "Model" while holding the evaluator's deployment. Labelled with the
// raw tag it would read as a category; labelled as the evaluator's run it reads as what it is. It is also
// why this map must not simply title-case the tag: "Provenance" already means a column's origin here.
export const SESSION_TAG_LABEL_KEY: Record<string, string> = {
  identity: SessionsTraceI18nKey.TagIdentity,
  principal: SessionsTraceI18nKey.TagPrincipal,
  response: SessionsTraceI18nKey.TagResponse,
  'token-usage': SessionsTraceI18nKey.TagTokenUsage,
  cost: SessionsTraceI18nKey.TagCost,
  performance: SessionsTraceI18nKey.TagPerformance,
  deployment: SessionsTraceI18nKey.TagDeployment,
  insight: SessionsTraceI18nKey.TagInsight,
  provenance: SessionsTraceI18nKey.TagProvenance,
};

// The type of a *value* compared against the field. For an array column that is its element type: the
// predicate is a membership test over the elements, never a comparison against the array itself.
export const SESSION_FIELD_VALUE_TYPE: Partial<Record<SessionsField, QueryValueType>> = {
  [SessionsField.ChatId]: QueryValueType.String,
  [SessionsField.Deployments]: QueryValueType.String,
  [SessionsField.ProjectId]: QueryValueType.String,
  [SessionsField.UserHash]: QueryValueType.String,
  [SessionsField.TurnCount]: QueryValueType.Integer,
  [SessionsField.TotalTokens]: QueryValueType.Integer,
  [SessionsField.TotalPrice]: QueryValueType.Decimal,
  [SessionsField.LastRequestTime]: QueryValueType.Timestamp,
  [SessionsField.FirstRequestTime]: QueryValueType.Timestamp,
  [SessionsField.InsightTitle]: QueryValueType.String,
  [SessionsField.InsightSummary]: QueryValueType.String,
  [SessionsField.InsightSentiment]: QueryValueType.String,
  [SessionsField.InsightTopic]: QueryValueType.String,
  [SessionsField.InsightTopics]: QueryValueType.String,
  [SessionsField.InsightLanguage]: QueryValueType.String,
  [SessionsField.InsightResolutionStatus]: QueryValueType.String,
  [SessionsField.InsightActivityType]: QueryValueType.String,
  [SessionsField.InsightActivitySubTaskType]: QueryValueType.String,
};

export const SESSION_FILTER_QUERY_OPERATOR: Record<
  Exclude<SessionFilterOperator, SessionFilterOperator.Range>,
  QueryOperator
> = {
  [SessionFilterOperator.In]: QueryOperator.In,
  [SessionFilterOperator.Contains]: QueryOperator.Ico,
  [SessionFilterOperator.NotContains]: QueryOperator.Inc,
  [SessionFilterOperator.Equals]: QueryOperator.Eq,
  [SessionFilterOperator.NotEquals]: QueryOperator.Ne,
  [SessionFilterOperator.GreaterThan]: QueryOperator.Gt,
  [SessionFilterOperator.GreaterThanOrEqual]: QueryOperator.Ge,
  [SessionFilterOperator.LessThan]: QueryOperator.Lt,
  [SessionFilterOperator.LessThanOrEqual]: QueryOperator.Le,
};

export const GRID_FILTER_TYPE_OPERATOR: Record<GridFilterType, SessionScalarOperator> = {
  [GridFilterType.CONTAINS]: SessionFilterOperator.Contains,
  [GridFilterType.NOT_CONTAINS]: SessionFilterOperator.NotContains,
  [GridFilterType.EQUALS]: SessionFilterOperator.Equals,
  [GridFilterType.NOT_EQUAL]: SessionFilterOperator.NotEquals,
  [GridFilterType.GREATER_THAN]: SessionFilterOperator.GreaterThan,
  [GridFilterType.GREATER_THAN_OR_EQUAL]: SessionFilterOperator.GreaterThanOrEqual,
  [GridFilterType.LESS_THAN]: SessionFilterOperator.LessThan,
  [GridFilterType.LESS_THAN_OR_EQUAL]: SessionFilterOperator.LessThanOrEqual,
};

// One colour per origin, from theme tokens. Every value here clears WCAG AA for normal text against
// `bg-layer-1` through `bg-layer-4`, which the grid's header row and the detail rail both draw on:
// accent-primary 7.8:1 → 5.7:1, accent-secondary 8.1:1 → 5.9:1, warning 11.7:1 → 8.6:1. `accent-tertiary`
// is the unused accent and would have been the obvious third hue, but it reads 4.32:1 on `bg-layer-4` —
// under the 4.5:1 floor for the 12px semibold the group header uses.
// An unnamed enrichment takes `text-secondary` (7.8:1 → 5.7:1) rather than a fourth hue: sharing a colour
// with a named origin would say the two are the same source.
export const PROVENANCE_TEXT_CLASS: Record<ColumnProvenance, string> = {
  [ColumnProvenance.Sessions]: 'text-accent-primary',
  [ColumnProvenance.Insights]: 'text-accent-secondary',
  [ColumnProvenance.Feedback]: 'text-warning',
  [ColumnProvenance.Other]: 'text-secondary',
};

export const COST_TEXT_CLASS = 'text-accent-secondary';

// One palette, one taxonomy. The tree's rows, its filter controls and the detail badge all read `SpanKind`,
// so a row can no longer describe itself in one vocabulary while its own detail uses another.
//
// The hues also match `SessionTraceChips`, which the same reader sees on the listing card before opening
// the trace: embeddings teal, route amber. The tree had them crossed, because `route` carried the neutral hue
// while it was excluded and took the free colour when it started rendering.

// Filled rather than outlined — a rail badge is not a filter control — but the same hue as the kind's node.
export const SPAN_KIND_CLASS: Record<SpanKind, string> = {
  [SpanKind.Llm]: 'bg-accent-primary-alpha text-accent-primary',
  [SpanKind.Mcp]: 'bg-accent-tertiary-alpha text-accent-tertiary',
  [SpanKind.Embeddings]: 'bg-accent-secondary-alpha text-accent-secondary',
  [SpanKind.Route]: 'bg-warning text-warning',
  // Rating shares the neutral hue with the generic kind, by kinship: a rating is not part of the turn's work
  // at all — it arrives as its own single-hop trace afterwards — and the two therefore never render beside
  // each other, so sharing costs the reader nothing. Each still states its kind in words.
  [SpanKind.Rating]: 'bg-layer-4 text-secondary',
  [SpanKind.Other]: 'bg-layer-4 text-secondary',
};

// Failure is its own axis, so it has its own class rather than a member of the kind palette.
export const SPAN_FAILED_CLASS = 'bg-error text-error';

// The other half of that axis, for the status a hop reports: `text-success` on `bg-success` clears AA, and it
// is never the only thing distinguishing the two states — the chip prints the protocol's own words too.
export const HOP_STATUS_OK_CLASS = 'bg-success text-success';

// The verb the request was sent with, marked like the kind badges in the tree, and stated in words too.
export const HOP_METHOD_CLASS = 'bg-accent-primary-alpha text-accent-primary';

export const INSIGHTS_ABSENCE_KEY: Record<Exclude<SessionInsightsState, SessionInsightsState.Available>, string> = {
  [SessionInsightsState.NotEvaluated]: SessionsTraceI18nKey.DetailInsightsNotEvaluated,
  [SessionInsightsState.EnrichmentUnavailable]: SessionsTraceI18nKey.DetailInsightsUnavailable,
};

export const EMPTY_ICON_SIZE = 24;

// One size for every body panel's loader: the panels are siblings in one tab strip, and a loader that changes
// size between tabs reads as a different kind of wait.
export const INSPECTOR_LOADER_SIZE = 18;

// A pressed-state chip's own metrics, matching ui-kit's small *chip* (20px tall, 6px of horizontal padding,
// barely-rounded corners) rather than its small *button* (24px, 8px, fully rounded): a row of these reads as
// a filter bar rather than as a row of buttons.
//
// Every class here is important-qualified, and each for its own reason. The radius comes from ui-kit's
// stylesheet — every 2.0 button class carries `border-radius: 9999px` — so a plain `rounded-sm` sits at equal
// specificity against it and the winner would depend on stylesheet order. The height and padding come from
// utilities the button puts on the element, and ui-kit concatenates the caller's `className` onto its own
// with `classnames` rather than merging with `tailwind-merge` — so `h-[24px]` and `px-2` stay in the
// attribute alongside these, and again only order would decide.
export const FILTER_CHIP_CLASS = 'border !h-5 !rounded-sm !px-1.5';

// Every message is labelled with its own role wherever it renders, which is what makes stating a system
// prompt safe: nothing can read as something a person typed.
export const MESSAGE_ROLE_LABEL_KEY: Record<MessageRole, string> = {
  [MessageRole.System]: SessionsTraceI18nKey.InspectorRoleSystem,
  [MessageRole.User]: SessionsTraceI18nKey.InspectorRoleUser,
  [MessageRole.Assistant]: SessionsTraceI18nKey.InspectorRoleAssistant,
  [MessageRole.Tool]: SessionsTraceI18nKey.InspectorRoleTool,
  [MessageRole.Other]: SessionsTraceI18nKey.InspectorRoleOther,
};

export const SPAN_KIND_RAIL_CLASS: Record<SpanKind, string> = {
  [SpanKind.Llm]: 'border-accent-primary',
  [SpanKind.Mcp]: 'border-accent-tertiary',
  [SpanKind.Embeddings]: 'border-accent-secondary',
  [SpanKind.Route]: 'border-warning',
  [SpanKind.Rating]: 'border-primary',
  [SpanKind.Other]: 'border-primary',
};

export const SPAN_KIND_CHIP_CLASS: Record<SpanKind, string> = {
  [SpanKind.Llm]: 'border-accent-primary text-accent-primary',
  [SpanKind.Mcp]: 'border-accent-tertiary text-accent-tertiary',
  [SpanKind.Embeddings]: 'border-accent-secondary text-accent-secondary',
  [SpanKind.Route]: 'border-warning text-warning',
  [SpanKind.Rating]: 'border-primary text-secondary',
  [SpanKind.Other]: 'border-primary text-secondary',
};

export const NEUTRAL_CHIP_CLASS = 'border-primary text-secondary';

// A chosen filter, in the accent the console uses for an action rather than in a lighter grey box. `bg-layer-4`
// against a `bg-layer-2` panel read as a slab of background rather than as a selection, and the row of them
// read as disabled. Every token here is one the palette defines.
export const SELECTED_CHIP_CLASS = 'border-accent-primary bg-accent-primary-alpha text-accent-primary';

// The outcome axis carries its own colour rather than borrowing one from the kind palette, so a failure reads
// as a failure whatever kind of call it happened to.
export const HOP_FAILED_RAIL_CLASS = 'border-error';

export const HOP_FAILED_CHIP_CLASS = 'border-error text-error';

export const UNRECORDED_ROOT_RAIL_CLASS = 'border-primary';

export const TREE_GUIDE_CLASS = 'border-primary';

// The order the filter controls appear in, and the only place that order is stated. The set actually offered
// is this list narrowed to the kinds the turn recorded.
export const FILTERABLE_SPAN_KINDS: SpanKind[] = [
  SpanKind.Llm,
  SpanKind.Mcp,
  SpanKind.Embeddings,
  SpanKind.Route,
  SpanKind.Rating,
  SpanKind.Other,
];

export const SPAN_KIND_LABEL_KEY: Record<SpanKind, string> = {
  [SpanKind.Embeddings]: SessionsTraceI18nKey.SpanEmbeddings,
  [SpanKind.Mcp]: SessionsTraceI18nKey.SpanMcp,
  [SpanKind.Route]: SessionsTraceI18nKey.SpanRoute,
  [SpanKind.Llm]: SessionsTraceI18nKey.SpanLlm,
  [SpanKind.Rating]: SessionsTraceI18nKey.SpanRating,
  [SpanKind.Other]: SessionsTraceI18nKey.SpanOther,
};

export const UNAVAILABLE_VALUE = '—';

export const SESSION_FEEDBACK_LIMIT = 100;

export const SESSION_INSIGHTS_PANEL: SessionPanelFrame = {
  panel: SessionDetailPanel.Insights,
  sourceEntity: SESSIONS_ENTITY,
  provenance: ColumnProvenance.Insights,
  labelKey: SessionsTraceI18nKey.DetailPanelInsights,
};

export const SESSION_FEEDBACK_PANEL: SessionPanelFrame = {
  panel: SessionDetailPanel.Feedback,
  sourceEntity: FEEDBACK_ENTITY,
  provenance: ColumnProvenance.Feedback,
  labelKey: SessionsTraceI18nKey.DetailPanelFeedback,
};

export const SESSION_DETAIL_PANELS: SessionPanelDefinition[] = [
  {
    panel: SessionDetailPanel.Usage,
    sourceEntity: SESSIONS_ENTITY,
    provenance: ColumnProvenance.Sessions,
    labelKey: SessionsTraceI18nKey.DetailPanelUsage,
    layout: SessionPanelLayout.Grid,
    fields: [
      {
        labelKey: SessionsTraceI18nKey.DetailTokensIn,
        column: SessionsField.PromptTokens,
        format: SessionFieldFormat.Count,
      },
      {
        labelKey: SessionsTraceI18nKey.DetailTokensOut,
        column: SessionsField.CompletionTokens,
        format: SessionFieldFormat.Count,
      },
      {
        labelKey: SessionsTraceI18nKey.DetailTotalTokens,
        column: SessionsField.TotalTokens,
        format: SessionFieldFormat.Count,
      },
      {
        labelKey: SessionsTraceI18nKey.Cost,
        column: SessionsField.TotalPrice,
        format: SessionFieldFormat.Cost,
        accentClassName: COST_TEXT_CLASS,
      },
      // Both figures are wrong in their own way, so each states its own caveat rather than sharing one: a
      // note naming only the sum would leave the average looking sound. The grid's Duration column used to
      // carry the first of these; it no longer exists, and these are the only surfaces left showing either.
      {
        labelKey: SessionsTraceI18nKey.DetailDuration,
        column: SessionsField.DurationMs,
        format: SessionFieldFormat.Duration,
        hintKey: SessionsTraceI18nKey.DurationHint,
      },
      {
        labelKey: SessionsTraceI18nKey.DetailAvgDuration,
        column: SessionsField.AvgDurationMs,
        format: SessionFieldFormat.Duration,
        hintKey: SessionsTraceI18nKey.AvgDurationHint,
      },
    ],
  },
  {
    panel: SessionDetailPanel.Metadata,
    sourceEntity: SESSIONS_ENTITY,
    provenance: ColumnProvenance.Sessions,
    labelKey: SessionsTraceI18nKey.DetailPanelMetadata,
    layout: SessionPanelLayout.Rows,
    fields: [
      { labelKey: SessionsTraceI18nKey.Session, column: SessionsField.ChatId },
      { labelKey: SessionsTraceI18nKey.DetailUser, column: SessionsField.UserHash },
      { labelKey: SessionsTraceI18nKey.Project, column: SessionsField.ProjectId },
      {
        labelKey: SessionsTraceI18nKey.DetailStarted,
        column: SessionsField.FirstRequestTime,
        format: SessionFieldFormat.DateTime,
      },
      {
        labelKey: SessionsTraceI18nKey.DetailSuccessful,
        column: SessionsField.SuccessCount,
        format: SessionFieldFormat.Count,
      },
      {
        labelKey: SessionsTraceI18nKey.DetailTrace,
        column: SessionsField.Traces,
        format: SessionFieldFormat.List,
      },
      {
        labelKey: SessionsTraceI18nKey.DetailDeployment,
        column: SessionsField.Deployments,
        format: SessionFieldFormat.List,
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
  [SessionColumn.Rating]: ColumnProvenance.Feedback,
};

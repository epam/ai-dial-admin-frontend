import { Icon as TablerIcon } from '@tabler/icons-react';

import { TreeRow } from '@/src/components/Common/TreeGrid/types';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QuerySortDirection, QueryValueType } from '@/src/models/analytics/query';

// Where a column's value comes from, which decides what an empty cell means: a rollup column is present for
// every conversation, an enrichment column is absent until an evaluation reaches it, and a feedback column is
// resolved by a separate query for the page on screen.
export enum ColumnProvenance {
  Conversations = 'conversations',
  Insights = 'insights',
  Feedback = 'feedback',
  // An enrichment this frontend knows no name for. The entity's enrichments are provisioned per instance,
  // so one can appear that no release anticipated; its columns are still offered, attributed to it by the
  // namespace its own field names carry.
  Other = 'other',
}

export type ConversationScalar = number | string | boolean | null;

export interface ConversationRow extends ConversationRatingCounts {
  client_session_id: string;
  project_id: string;
  user_hash: string | null;
  turn_count: number | string | null;
  total_tokens: number | string | null;
  total_price: number | string | null;
  last_request_time: number | string | null;
  first_request_time: number | string | null;
  'session_insights.title'?: string | null;
}

export type ConversationListRow = ConversationRow & Record<string, ConversationScalar | undefined>;

export interface ConversationTitleSource {
  'session_insights.title'?: string | null;
}

export interface ConversationsPage {
  rows: ConversationRow[];
  total: number | null;
  period?: ConversationPeriodSummary;
  candidates?: ConversationCandidateIds;
  // The value sets the first page of this result resolved for its array-valued column filters, for the
  // caller to carry into every later page of it. See `ConversationPageRequest.arrayFilters`.
  arrayFilters?: ConversationArrayFilter[];
}

export interface ConversationPeriodSummary {
  totals?: ConversationTotals;
  ratings?: ConversationRatingTotals;
}

export interface ConversationTotals {
  conversations: number | string | null;
  cost: number | string | null;
}

export interface ConversationRatingTotals {
  rated: number | null;
  negative: number | null;
}

export interface ConversationRatingRow {
  chat_id: string;
  rating_up: number | string | null;
  rate_zero: number | string | null;
  rate_negative: number | string | null;
  rate_bool_false: number | string | null;
  rate_raw: number | string | null;
  rate_events: number | string | null;
}

export interface RatingCounts {
  rating_up: number | null;
  rating_down: number | null;
}

export interface ConversationRatingCounts extends RatingCounts {
  provable_down?: number | null;
  captured_form?: number | null;
  rate_events?: number | null;
}

export enum FeedbackFilter {
  All = 'all',
  Positive = 'positive',
  Negative = 'negative',
  Rated = 'rated',
}

export enum ConversationFilterOperator {
  Contains = 'contains',
  NotContains = 'notContains',
  Equals = 'equals',
  NotEquals = 'notEquals',
  GreaterThan = 'greaterThan',
  GreaterThanOrEqual = 'greaterThanOrEqual',
  LessThan = 'lessThan',
  LessThanOrEqual = 'lessThanOrEqual',
  Range = 'range',
  // Set membership, which a value filter contributes for its whole selection. Its operand is a list rather
  // than one value, so it is the one operator no text or number filter menu can produce.
  In = 'in',
}

// Every operator whose operand is a single value — one or two of them for a range.
export type ConversationScalarOperator = Exclude<ConversationFilterOperator, ConversationFilterOperator.In>;

export interface ConversationScalarFilter {
  field: string;
  operator: ConversationScalarOperator;
  value: string;
  valueTo?: string;
  valueType?: QueryValueType;
}

export interface ConversationValueSetFilter {
  field: string;
  operator: ConversationFilterOperator.In;
  values: string[];
  valueType?: QueryValueType;
}

export type ConversationColumnFilter = ConversationScalarFilter | ConversationValueSetFilter;

// One filter over an array-valued column, with its text already resolved to the whole values it matched.
// The resolution is a second query and belongs to the server action, so this shape never reaches the client:
// the grid's filter model carries the text, and only the listing query sees the values.
export interface ConversationArrayFilter {
  field: string;
  operator: ConversationScalarOperator;
  values: string[];
  valueType?: QueryValueType;
}

// Where an array column's elements are drawn from, which is what a contains filter resolves its text
// against. The array's own column cannot answer it: the service's array predicates match whole elements,
// with no lambda form to test a substring of one.
export interface ConversationArrayValueSource {
  entity: string;
  field: string;
  timeField: string;
}

export interface ConversationSortKey {
  field: string;
  direction: QuerySortDirection;
}

export interface ConversationFilters {
  search: string;
  startMs: number;
  endMs: number;
  feedback: FeedbackFilter;
  columnFilters?: ConversationColumnFilter[];
}

export interface ConversationPageRequest extends ConversationFilters {
  offset: number;
  limit: number;
  // Carried by a later page only: the first page resolves the candidate ids and returns them, and the
  // client sends them back for the rest of that result.
  chatIds?: string[];
  sort?: ConversationSortKey[];
  sourceFields?: string[];
  visibleEnrichmentFields?: string[];
  // Carried by a later page only, exactly as `chatIds` is: the resolution reads a live table, so resolving
  // again per scroll block could narrow a later page by a different set of values and make rows duplicate
  // or vanish across the scroll.
  arrayFilters?: ConversationArrayFilter[];
}

// One value an enum-typed column holds, with how many conversations carry it under the page's other
// narrowing.
export interface ConversationFieldValue {
  value: string;
  count: number | null;
}

// What the value filter's popup is showing while it resolves its list. A failed or empty read is a state of
// its own rather than a fallback to a text entry: an operator who opened one control and was handed another
// would enter a value under the wrong operator.
export enum ConversationValuesState {
  Loading = 'loading',
  Available = 'available',
  Empty = 'empty',
  LoadFailed = 'loadFailed',
}

export interface ConversationValueFilterModel {
  values: string[];
}

// What the grid hands its filter components through `context`. The facet has to carry the page's period,
// search term, feedback candidates and other columns' filters, all of which are the conversations hook's
// state — so the hook supplies the reader and the control stays unaware of any of it.
export interface ConversationGridContext {
  requestFieldValues: (field: string) => Promise<ConversationFieldValue[] | null>;
}

export interface ConversationFieldValuesRequest extends ConversationFilters {
  field: string;
  // The feedback narrowing reaches the query as candidate ids the first page resolved, so a facet count
  // agrees with the rows only when the caller sends the same set it is paging under. The value sets an
  // array-valued column filter resolved travel for the same reason.
  chatIds?: string[];
  arrayFilters?: ConversationArrayFilter[];
}

export interface ConversationCandidateIds {
  ids: string[];
  isCapped: boolean;
}

// Offered fields split by what projecting one costs, which is not the same question as whether its column
// is on screen. Measured over 6 328 conversations, twenty ordinary columns instead of two cost 1.6 MiB and
// 2 ms — so gating them would only buy a re-fetch on every reveal. The one field the service marks heavy
// cost 2.7× the other ten together, so it is worth the re-fetch.
export interface ConversationProjectableFields {
  cheapSource: string[];
  // Also plain columns, but marked heavy by the service, so projected only while their columns show.
  heavySource: string[];
  // Supplied by a joined enrichment, so naming one adds that join to every page. Projected on visibility.
  enrichment: string[];
  // Enrichment-backed and projected unconditionally — the identity column reads these and cannot be hidden.
  requiredEnrichment: string[];
}

export interface ProvenanceEntity {
  provenance: ColumnProvenance;
  name: string;
}

// The view's rows are sessions: one row per client session id, which the service sets to the conversation's
// `chat_id` wherever a hop carries one. `ChatId` keeps its symbol name so every call site reads unchanged.
export enum ConversationsField {
  ChatId = 'client_session_id',
  ProjectId = 'project_id',
  UserHash = 'user_hash',
  TurnCount = 'turn_count',
  TotalTokens = 'total_tokens',
  TotalPrice = 'total_price',
  PromptTokens = 'prompt_tokens',
  CompletionTokens = 'completion_tokens',
  SuccessCount = 'success_count',
  DurationMs = 'duration_ms',
  AvgDurationMs = 'avg_duration_ms',
  Deployments = 'deployments',
  FirstRequestTime = 'first_request_time',
  LastRequestTime = 'last_request_time',
  Traces = 'traces',
  // The insight fields are enrichment columns: the service exposes each under a qualified flat name, and
  // the dot belongs to the name rather than marking a path into a nested value.
  InsightTitle = 'session_insights.title',
  InsightSummary = 'session_insights.summary',
  InsightSentiment = 'session_insights.sentiment',
  InsightTopic = 'session_insights.topic',
  InsightTopics = 'session_insights.topics',
  InsightLanguage = 'session_insights.language',
  InsightResolutionStatus = 'session_insights.resolution_status',
  InsightActivityType = 'session_insights.activity_type',
  InsightActivitySubTaskType = 'session_insights.activity_sub_task_type',
}

// Grid-only column ids: every other column binds to a `ConversationsField`, but Rating is composed
// from the rating rollup's lookups and has no field on the conversations entity.
export enum ConversationColumn {
  Rating = 'rating',
}

export enum ConversationTotalsField {
  Conversations = 'conversations',
  Cost = 'cost',
}

export enum ConversationRatingTotalsField {
  Conversations = 'rated_conversations',
}

export enum ResponseRatingsField {
  ChatId = 'chat_id',
  ResponseId = 'response_id',
  FirstRateTime = 'first_rate_time',
  LastRateTime = 'last_rate_time',
  RatePosCount = 'rate_pos_count',
  RateZeroCount = 'rate_zero_count',
  RateNegCount = 'rate_neg_count',
  RateBoolFalseCount = 'rate_bool_false_count',
  RateRawCount = 'rate_raw_count',
  RateEventCount = 'rate_event_count',
  RateDistinctCount = 'rate_distinct_count',
  CommentCount = 'comment_count',
  CommentSample = 'comment_sample',
}

export enum FeedbackField {
  LastRated = 'last_rated',
  RatingUp = 'rating_up',
  RateZero = 'rate_zero',
  RateNegative = 'rate_negative',
  RateBoolFalse = 'rate_bool_false',
  RateRaw = 'rate_raw',
  RateEvents = 'rate_events',
}

export type ConversationColumnId = ConversationsField | ConversationColumn;

// One rendered column group, keyed on the pair of a column's origin and the tag the schema gives its field.
// The pair rather than the tag alone: a rollup field and an enrichment field can carry the same tag, and one
// group holding both would attribute an enrichment value to the rollup — which is the mis-attribution the
// grouping exists to prevent, since the two produce different kinds of empty cell.
export interface ConversationColumnGroup {
  provenance: ColumnProvenance;
  // The enrichment supplying these fields, empty for the rollup; names a group this frontend cannot label.
  source: string;
  // Empty where the schema reports no tag for the field — including every column when the schema could not
  // be fetched at all, which is what collapses the groups back to one per origin.
  tag: string;
  fields: string[];
}

export interface ConversationDetailRow {
  client_session_id: string;
  // Which field the id was read from. Decides the column every hop-log read for this session predicates on.
  client_session_source?: string | null;
  project_id: string | null;
  user_hash: string | null;
  turn_count: number | string | null;
  first_request_time: number | string | null;
  last_request_time: number | string | null;
  prompt_tokens: number | string | null;
  completion_tokens: number | string | null;
  total_tokens: number | string | null;
  total_price: number | string | null;
  success_count: number | string | null;
  duration_ms: number | string | null;
  avg_duration_ms: number | string | null;
  deployments: string[] | null;
  traces?: string[] | null;
  // Optional because the insight enrichment runs per conversation: a conversation the evaluator has not
  // processed has no insight row at all, so the service returns no value under these names.
  'session_insights.title'?: string | null;
  'session_insights.summary'?: string | null;
  'session_insights.sentiment'?: string | null;
  'session_insights.topic'?: string | null;
  'session_insights.topics'?: string | null;
  'session_insights.language'?: string | null;
  'session_insights.resolution_status'?: string | null;
  'session_insights.activity_type'?: string | null;
  'session_insights.activity_sub_task_type'?: string | null;
}

export interface ConversationDetailResult {
  conversation: ConversationDetailRow | null;
}

export interface ConversationFeedbackRow {
  response_id: string | null;
  first_rate_time: number | string | null;
  last_rate_time: number | string | null;
  rate_pos_count: number | string | null;
  rate_zero_count: number | string | null;
  rate_neg_count: number | string | null;
  rate_distinct_count: number | string | null;
  comment_count: number | string | null;
  comment_sample?: string | null;
}

export interface ConversationFeedbackPage {
  rows: ConversationFeedbackRow[];
  total: number | null;
  ratings: ConversationRatingCounts | null;
  isCommentTextReadable: boolean;
}

// What a session's hops are located by. `source` is the rollup's `client_session_source`: the value
// `chat_id` means the id came from a conversation header, and anything else means it came from a coding
// harness, whose hops carry no `chat_id` at all.
export interface SessionScope {
  id: string;
  source?: string | null;
}

export enum UsageLogField {
  ChatId = 'chat_id',
  // The identity enrichment's normalised session key: a chat's own id where the hop carries one, the
  // harness session id otherwise. Not one of the table's bloom-filtered columns, so it scopes a read only
  // where `chat_id` cannot — see `sessionScopeField`.
  ClientSessionId = 'usage_client_identity.client_session_id',
  TraceId = 'trace_id',
  CoreSpanId = 'core_span_id',
  CoreParentSpanId = 'core_parent_span_id',
  RequestTime = 'request_time',
  Deployment = 'deployment',
  EventKind = 'event_kind',
  TotalTokens = 'total_tokens',
  DeploymentPrice = 'deployment_price',
  // The chain-inclusive figure: on a root span it equals the sum of its subtree's own `deployment_price`
  // (verified against a live app-form trace), which is what makes the card's own/chain price pair readable.
  TotalPrice = 'total_price',
  // Leads the table's sort key, so it is the listing's only real prune besides the partition range. Also the
  // Core-internal marker's operand — a service call is recorded under Core's own project, not the caller's.
  ProjectId = 'project_id',
  // The exact join key to the rating source, which is grained by it.
  ResponseId = 'response_id',
  ParentDeployment = 'parent_deployment',
  RequestMethod = 'request_method',
  RequestUri = 'request_uri',
  ResponseUpstreamUri = 'response_upstream_uri',
  ResponseStatus = 'response_status',
  Success = 'success',
  OperationDurationMs = 'operation_duration_ms',
  McpMethod = 'mcp_method',
  McpToolCallName = 'mcp_tool_call_name',
  ExecutionPath = 'execution_path',
  NumberRequestMessages = 'number_request_messages',
  RequestBodyBytes = 'request_body_bytes',
  ResponseBodyBytes = 'response_body_bytes',
  ReasoningTokens = 'reasoning_tokens',
  RequestBody = 'request_body',
  ResponseBody = 'response_body',
  // A later addition to the hop log: an instance predating it does not persist the column, so it is named
  // only when the fetched schema reports it.
  AssembledResponse = 'assembled_response',
}

// A trace's own totals, as the drawer states them. Named for what it is rather than for the rollup it used
// to come from: the listing resolves these live now, and the drawer reads whichever figures the view that
// opened it already has.
// What the drawer states above a trace's hops. A view model, not a row — hence camelCase, matching the group
// and card models it is built from. `durationMs` is card-level and therefore absent when the drawer was
// opened from the transcript, which has no card to speak for.
export interface ConversationTraceFigures {
  traceId: string;
  startedAt: number | string | null;
  spans: number | string | null;
  failedSpans: number | string | null;
  tokens: number | string | null;
  price: number | string | null;
  durationMs?: number | string | null;
}

// The trace listing reads the hop log live, in three passes. The first pages traces and yields nothing but
// their ids and their own time bounds; the second reads every root span of that page for its own facts; the
// third resolves the traces' figures. The aliases below are what each pass projects, so a row's shape says
// which pass produced it.
export enum ConversationTracePageField {
  TraceId = 'trace_id',
  FirstRequestTime = 'first_request_time',
  LastRequestTime = 'last_request_time',
}

export interface ConversationTracePageRow {
  trace_id: string;
  first_request_time: number | string | null;
  last_request_time: number | string | null;
}

export enum ConversationTraceFigureField {
  TraceId = 'trace_id',
  EventKind = 'event_kind',
  Spans = 'spans',
  Tokens = 'tokens',
  Price = 'price',
  FailedSpans = 'failed_spans',
  ResponseIds = 'response_ids',
}

// One row per (trace, event kind): the per-kind rows are the chips, and their sums are the trace's figures.
export interface ConversationTraceFigureRow {
  trace_id: string;
  event_kind: string | null;
  spans: number | string | null;
  tokens: number | string | null;
  price: number | string | null;
  failed_spans: number | string | null;
  response_ids: string[] | null;
}

// A root span, read for the card it becomes. `project_id` is here because the Core-internal marker compares
// it against the conversation's; it is deliberately absent from the query's filter, where it would drop the
// rows the marker exists to find.
export interface ConversationTraceRootRow {
  trace_id: string;
  core_span_id: string;
  request_time: number | string | null;
  operation_duration_ms: number | string | null;
  success: boolean | null;
  response_status: number | null;
  total_tokens: number | string | null;
  total_price: number | string | null;
  deployment_price: number | string | null;
  'usage_client_identity.client_session_id': string | null;
  request_uri: string | null;
  event_kind: string | null;
  number_request_messages: number | string | null;
  deployment: string | null;
  project_id: string | null;
}

// Inclusive epoch-millis bounds, already padded. Carried as a value rather than recomputed per query so the
// roots and figures passes cannot end up scoped to different windows.
export interface ConversationTraceWindow {
  fromMs: number;
  toMs: number;
}

export interface ConversationTraceChip {
  eventKind: string;
  spans: number;
}

// What one recorded call states about itself. Every field is read from that root's own row — nothing here is
// a trace-level figure, and nothing is derived from a body.
export interface ConversationTraceCard {
  traceId: string;
  coreSpanId: string;
  startedAt: number | string | null;
  durationMs: number | string | null;
  isSuccess: boolean | null;
  responseStatus: number | null;
  ownTokens: number | string | null;
  ownPrice: number | string | null;
  chainPrice: number | string | null;
  deployment: string | null;
  requestUri: string | null;
  eventKind: string | null;
  requestMessages: number | string | null;
  hasConversationLabel: boolean;
  isCoreInternal: boolean;
}

// A trace and the cards beneath it. `isRootRecorded` false is the trace whose root the roots pass did not
// return: it still renders, from these figures alone. `elidedCardCount` is what the card cap held back, so
// the view can disclose it rather than truncating in silence.
export interface ConversationTraceGroup {
  traceId: string;
  startedAt: number | string | null;
  spans: number;
  tokens: number;
  price: number;
  failedSpans: number;
  chips: ConversationTraceChip[];
  responseIds: string[];
  cards: ConversationTraceCard[];
  elidedCardCount: number;
  isRootRecorded: boolean;
}

export interface ConversationTracePage {
  groups: ConversationTraceGroup[];
  hasMore: boolean;
}

export interface ConversationSpanRow {
  core_span_id: string;
  core_parent_span_id: string | null;
  event_kind: string | null;
  deployment: string | null;
  parent_deployment: string | null;
  request_method: string | null;
  request_uri: string | null;
  response_upstream_uri: string | null;
  response_status: number | null;
  success: boolean | null;
  operation_duration_ms: number | string | null;
  total_tokens: number | string | null;
  deployment_price: number | string | null;
  // The chain-inclusive price. A span that metered nothing of its own carries a null `deployment_price` and a
  // real `total_price`, so this is the only cost figure such a row has. Required, like every other column the
  // span query always selects: optional would put `undefined` in the type and no reader wants a third empty.
  total_price: number | string | null;
  request_time: number | string | null;
  response_body_bytes: number | string | null;
  request_body_bytes: number | string | null;
  number_request_messages: number | string | null;
  reasoning_tokens: number | string | null;
  mcp_method?: string | null;
  mcp_tool_call_name?: string | null;
  execution_path?: string[] | null;
}

// The outcome axis. One member, because there is no "succeeded" control to offer: the turn's own status
// figure already says whether anything failed, and a control marking almost every node answers nothing.
export enum HopOutcomeFilter {
  Failed = 'failed',
}

// What the tree is currently emphasising — a kind of call, or the outcome axis, or nothing.
export type HopEmphasis = SpanKind | HopOutcomeFilter;

export enum HopNodeKind {
  Hop = 'hop',
  UnrecordedRoot = 'unrecorded-root',
}

// Which figures a row has to state. The choice is made from what the hop recorded, never from what kind of
// entity answered it: an application hop records no tokens and no price of its own while carrying a real
// chain price, so a single token-shaped line would render it as `0 tok` and a dash and read as broken data.
export enum HopFactsShape {
  Metered = 'metered',
  Unmetered = 'unmetered',
}

export interface HopMeteredFacts {
  shape: HopFactsShape.Metered;
  tokens: number | null;
  requestMessages: number | null;
  cost: number | string | null;
}

// Duration is not a member: every row states it in its own column, whatever shape its facts take, so
// repeating it here would print it twice on exactly the rows that have least else to show.
//
// Neither is the upstream host. It is constant across every hop of one deployment, so as a row fact it
// restates the row's own name once per row — and being the longest token on the line, it pushed the hop's
// method into truncation. The detail panel states it in full, once, for the hop the reader opened.
export interface HopUnmeteredFacts {
  shape: HopFactsShape.Unmetered;
  chainCost: number | string | null;
}

export type HopFacts = HopMeteredFacts | HopUnmeteredFacts;

// The turn's recorded MCP tool calls per name, and whether the span read that produced them was complete.
// The two travel together because a count read from a capped page cannot support a claim about an absence.
export interface McpToolCallTally {
  counts: Record<string, number>;
  isComplete: boolean;
}

export interface HopNodeData {
  kind: HopNodeKind;
  type: SpanKind | null;
  label: string;
  // What the hop did, where its kind records one — an MCP tool call or protocol method. It sits beside the
  // label rather than replacing it, so a protocol message states both its server and its method.
  detail: string | null;
  span: ConversationSpanRow | null;
  startedAtMs: number | null;
  durationMs: number | null;
  facts: HopFacts | null;
  isFailed: boolean;
  position: number;
  isMatch: boolean;
}

export type HopTreeNode = TreeRow<HopNodeData>;

export interface HopTreeRow {
  node: HopTreeNode;
  ancestorHasNextSibling: boolean[];
  isLastChild: boolean;
}

export interface ConversationSpansPage {
  spans: ConversationSpanRow[];
  total: number | null;
}

// What kind of call a hop stands for. Named as the hop log names them, and deliberately carrying no failure
// member: a failed model call and a failed tool call are different problems, and one set naming both "error"
// says neither. Failure travels beside the kind, never instead of it.
//
// It deliberately asserts nothing about *what answered* the call. An application hop and a model hop are
// recorded as the same kind of call, and no column separates them reliably — so a call to an application's
// chat endpoint is an `Llm` call, which is the only thing the log actually records.
export enum SpanKind {
  Llm = 'llm',
  Mcp = 'mcp',
  Embeddings = 'embeddings',
  Route = 'route',
  // A rating the reader left on the turn. It arrives as its own single-hop trace and records no event kind,
  // so it is recognised by its endpoint — the same mechanism an unlabelled model call is classified by.
  Rating = 'rating',
  Other = 'other',
}

export interface ConversationSpanNode {
  span: ConversationSpanRow;
  kind: SpanKind;
  hasFailed: boolean;
  startedAtMs: number | null;
}

export enum MessageRole {
  User = 'user',
  Assistant = 'assistant',
  System = 'system',
  Tool = 'tool',
  // A role this frontend does not recognise. Dropping such a message would hide recorded work, which is the
  // worse failure in an observability tool — the same deny-list reasoning the hop typing follows.
  Other = 'other',
}

// The hop log records model calls in two structurally different dialects, told apart by the endpoint alone.
// `Unknown` is not a failure: it routes the hop to the raw view, which answers completely for a dialect this
// frontend has not met.
export enum HopDialect {
  ChatCompletions = 'chat-completions',
  Messages = 'messages',
  Responses = 'responses',
  Unknown = 'unknown',
}

export enum HopInspectorSide {
  Request = 'request',
  Response = 'response',
}

// Why a side has no content to fetch, decided from the hop row before any body read.
export enum HopSideSuppression {
  NoResponse = 'no-response',
  SessionSetup = 'session-setup',
  Vector = 'vector',
}

export interface HopSideSuppressions {
  request: HopSideSuppression | null;
  response: HopSideSuppression | null;
}

// Withheld, empty and failed are three different facts about a side, and rendering any two of them
// identically hides an outage behind an entitlement or an entitlement behind an empty result.
export enum HopReadState {
  Available = 'available',
  ColumnWithheld = 'column-withheld',
  NoBody = 'no-body',
  LoadFailed = 'load-failed',
  // The body was read but no parser claims its dialect. The raw view is the answer.
  Unstructured = 'unstructured',
}

// A parameter the request carried, or one of the four always stated with a null value when it did not —
// absence is itself a debugging answer.
export interface HopParam {
  name: string;
  value: string | null;
}

export interface HopParams {
  stated: HopParam[];
  unrecognisedCount: number;
}

// What an assistant asked for, carried as part of the history rather than as metadata about it. An assistant
// message that only called a tool records `content` as `""`, so the call *is* what that message said.
export interface HopToolCall {
  name: string;
  args: string | null;
}

export interface HopRoleCount {
  role: MessageRole;
  count: number;
}

// One entry per recorded message. `bytes` is the size of the recorded JSON, not of the rendered text, so a
// message whose text was clamped away entirely still states honestly what made the request heavy.
export interface HopMessageEntry {
  index: number;
  role: MessageRole;
  bytes: number;
  text: string | null;
  toolCalls: HopToolCall[];
  isTextClamped: boolean;
  isLarge: boolean;
}

// What a dialect parser yields before clamping and budgeting: the recorded shape, read once, with no
// presentation decisions taken. Keeping the parsers free of the clamp is what lets both dialects share one
// envelope builder and one set of budget rules.
export interface HopDialectMessage {
  role: MessageRole;
  text: string | null;
  toolCalls: HopToolCall[];
  bytes: number;
}

export interface HopRequestEnvelope {
  state: HopReadState;
  dialect: HopDialect;
  params: HopParams;
  messages: HopMessageEntry[];
  roleCounts: HopRoleCount[];
  recordedBytes: number | null;
  // Set when the envelope's own total budget was reached, so the message list is short of what was recorded.
  isClamped: boolean;
}

export enum HopResponseMode {
  Assembled = 'assembled',
  Raw = 'raw',
}

// A clamp states itself **and** states by how much. One shape for every clamped thing, so the three places
// that clamp cannot each invent their own spelling of the same sentence — and so none of them can carry the
// flag without carrying the numbers, which is how two of them ended up computing a clamp and never saying so.
export interface HopClamp {
  isClamped: boolean;
  recordedBytes: number | null;
  deliveredBytes: number | null;
}

export interface HopResponseEnvelope {
  state: HopReadState;
  text: string | null;
  textClamp: HopClamp;
  // Stated separately from the answer, never merged into it: 54% of Responses hops record a reasoning
  // summary, and reading it as the reply would misattribute the model's own scratch work.
  reasoningText: string | null;
  finishReason: string | null;
  toolCalls: string[];
  recordedBytes: number | null;
}

// Tier 2 reads one *message* in full, not one property of one. The history is what a reader opens a hop for,
// and a property was never the unit they were asking about.
export interface HopMessageValue {
  state: HopReadState;
  text: string | null;
  toolCalls: HopToolCall[];
}

export interface HopRawBody {
  state: HopReadState;
  text: string | null;
  clamp: HopClamp;
}

// Which sides a read was actually entitled to. A fact panel is built from both body columns, so a builder
// that is not told which side it was denied has to report a withheld column and a hop that recorded nothing
// as the same empty field — the one distinction the inspector exists to keep.
export interface HopSideGrants {
  isRequestReadable: boolean;
  isResponseReadable: boolean;
}

export interface HopMcpFacts {
  state: HopReadState;
  method: string | null;
  toolName: string | null;
  toolset: string | null;
  argumentsText: string | null;
  resultText: string | null;
  resultClamp: HopClamp;
  // The result comes from the response column and the arguments from the request one, so a caller granted
  // only one side gets a panel that is half available and half withheld. `state` cannot say that.
  resultState: HopReadState;
}

// The token count is not here: it is `total_tokens` on the hop row, which the panel already has and which
// stays right when the body is withheld.
export interface HopEmbeddingFacts {
  state: HopReadState;
  model: string | null;
  inputCount: number | null;
  dimensions: number | null;
  inputText: string | null;
  inputClamp: HopClamp;
  // The dimension count is derived from the response column; every other field here comes from the request
  // one. Withheld and "the vector was not recorded" both produce no number, and they are not the same fact.
  isDimensionsWithheld: boolean;
}

export interface ConversationMessage {
  role: MessageRole;
  content: string | null;
  trace_id: string;
}

export enum TranscriptState {
  Available = 'available',
  ColumnsUnavailable = 'columns-unavailable',
  NotReconstructable = 'not-reconstructable',
  Expired = 'expired',
  NoMessages = 'no-messages',
  LoadFailed = 'load-failed',
}

export interface ConversationTranscript {
  state: TranscriptState;
  messages: ConversationMessage[];
  loadedTurns: number | null;
  // Figures for the traces this transcript covers, resolved by the same read. The Chat view states each
  // answer's own figures, and reading them from the listing's paged state would make a message's
  // completeness depend on how far the reader had scrolled a different view — so each view fetches what it
  // displays. Overlapping reads between the two are accepted; no cache is shared.
  traceFigures?: ConversationTraceGroup[];
}

// Whether this caller can read body columns at all. A *schema* fact, resolved before any body query, so it is
// known when the view switch first renders and can gate the Chat option there. The transcript's other states
// — aged out, not reconstructable, never recorded, failed — are facts about the rows themselves and resolve
// only once the body read runs, so they are stated inside the Chat view instead.
export interface ConversationTranscriptAvailability {
  isReadable: boolean;
  // Per side, because the inspector offers the two independently: the transcript needs both a question and an
  // answer, but a hop's request is worth reading on its own.
  isRequestReadable: boolean;
  isResponseReadable: boolean;
}

export interface TranscriptBodyFields {
  isReadable: boolean;
  isRequestReadable: boolean;
  isResponseReadable: boolean;
  responseFields: UsageLogField[];
}

export interface ConversationEntryHopRow {
  trace_id: string;
  request_time: number | string | null;
  deployment: string | null;
  number_request_messages: number | string | null;
  request_body_bytes: number | string | null;
  response_body_bytes: number | string | null;
}

export interface ConversationEntryBodyRow {
  trace_id: string;
  event_kind: string | null;
  request_body: string | null;
  response_body: string | null;
  assembled_response?: string | null;
  // Selected by the inspector's own read so the dialect is resolved server-side from the endpoint rather than
  // taken on trust from the caller. A plain column, and free beside the body it travels with.
  request_uri?: string | null;
}

export interface TranscriptStatePresentation {
  titleKey: string;
  hintKey: string;
  icon: TablerIcon;
  isError: boolean;
}

export enum ConversationDetailView {
  Chat = 'chat',
  Trace = 'trace',
}

export enum ConversationDetailPanel {
  Insights = 'insights',
  Usage = 'usage',
  Feedback = 'feedback',
  Metadata = 'metadata',
}

export enum ConversationFieldFormat {
  Count = 'count',
  Cost = 'cost',
  DateTime = 'date-time',
  Duration = 'duration',
  List = 'list',
}

export enum ConversationPanelLayout {
  Grid = 'grid',
  Rows = 'rows',
}

export interface ConversationFieldDefinition {
  labelKey: string;
  column?: ConversationsField;
  format?: ConversationFieldFormat;
  accentClassName?: string;
  // A caveat for a figure that cannot be read at face value. The panel exposes it through a focusable
  // control, so it reaches a keyboard as well as a pointer.
  hintKey?: string;
}

export interface ConversationPanelFrame {
  panel: ConversationDetailPanel;
  sourceEntity: string;
  provenance: ColumnProvenance;
  labelKey: string;
}

export interface ConversationPanelDefinition extends ConversationPanelFrame {
  layout: ConversationPanelLayout;
  fields: ConversationFieldDefinition[];
}

export enum ConversationFieldState {
  Available = 'available',
  Empty = 'empty',
  Unavailable = 'unavailable',
}

export enum ConversationInsightsState {
  Available = 'available',
  NotEvaluated = 'not-evaluated',
  EnrichmentUnavailable = 'enrichment-unavailable',
}

export interface ResolvedConversationField {
  labelKey: string;
  state: ConversationFieldState;
  text: string;
  accentClassName?: string;
  hintKey?: string;
}

// One insight column as the entity schema reports it, reduced to what the panel renders it with. Built from
// the schema rather than declared here, so a column the enrichment gains is described without a release:
// the label and the hint are the service's own words, and the type is what decides the value's formatting.
export interface ConversationInsightField {
  name: string;
  label: string;
  hint?: string;
  type: AnalyticsFieldType;
}

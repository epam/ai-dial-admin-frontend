import { Icon as TablerIcon } from '@tabler/icons-react';

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

export interface ConversationRow {
  chat_id: string;
  project_id: string;
  user_hash: string | null;
  turn_count: number | string | null;
  total_tokens: number | string | null;
  total_price: number | string | null;
  last_request_time: number | string | null;
  first_request_time: number | string | null;
  rating_up: number | null;
  rating_down: number | null;
  'conversation_insights.title'?: string | null;
}

export type ConversationListRow = ConversationRow & Record<string, ConversationScalar | undefined>;

export interface ConversationTitleSource {
  'conversation_insights.title'?: string | null;
}

export interface ConversationsPage {
  rows: ConversationRow[];
  // The grid's row count, coerced from the summary's conversation count. `totals` carries the same figure
  // for display, where a backend decimal string is still a valid value; the grid needs a number.
  total: number | null;
  // Both are resolved for a first-page request only. `totals` is absent when its query failed, which the
  // pills report as unavailable rather than as zero.
  totals?: ConversationTotals;
  candidates?: ConversationCandidateIds;
}

export interface ConversationTotals {
  conversations: number | string | null;
  cost: number | string | null;
}

export interface ConversationRatingRow {
  chat_id: string;
  rating_count: number | string | null;
}

export enum RatingDirection {
  Up = 'up',
  Down = 'down',
}

export interface RatingCounts {
  rating_up: number | null;
  rating_down: number | null;
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
}

export interface ConversationColumnFilter {
  field: string;
  operator: ConversationFilterOperator;
  value: string;
  valueTo?: string;
  valueType?: QueryValueType;
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
}

export interface ConversationSummary {
  rated: number;
  negative: number;
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

export enum ConversationsField {
  ChatId = 'chat_id',
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
  InsightTitle = 'conversation_insights.title',
  InsightSummary = 'conversation_insights.summary',
  InsightSentiment = 'conversation_insights.sentiment',
  InsightSentimentScore = 'conversation_insights.sentiment_score',
  InsightTopic = 'conversation_insights.topic',
  InsightTopics = 'conversation_insights.topics',
  InsightLanguage = 'conversation_insights.language',
  InsightResolutionStatus = 'conversation_insights.resolution_status',
  InsightTruncated = 'conversation_insights.truncated',
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

export enum RateAnalyticsField {
  ChatId = 'chat_id',
  Rate = 'rate',
  RequestTime = 'request_time',
  ResponseId = 'response_id',
}

export enum FeedbackField {
  LastRated = 'last_rated',
  RatingCount = 'rating_count',
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
  chat_id: string;
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
  'conversation_insights.title'?: string | null;
  'conversation_insights.summary'?: string | null;
  'conversation_insights.sentiment'?: string | null;
  'conversation_insights.sentiment_score'?: number | string | null;
  'conversation_insights.topic'?: string | null;
  'conversation_insights.topics'?: string | null;
  'conversation_insights.language'?: string | null;
  'conversation_insights.resolution_status'?: string | null;
  'conversation_insights.truncated'?: boolean | null;
}

export interface ConversationDetailResult {
  conversation: ConversationDetailRow | null;
}

export interface ConversationFeedbackRow {
  response_id: string | null;
  rate: number | null;
  request_time: number | string | null;
}

export interface ConversationFeedbackPage {
  rows: ConversationFeedbackRow[];
  total: number | null;
}

export enum UsageLogField {
  ChatId = 'chat_id',
  TraceId = 'trace_id',
  CoreSpanId = 'core_span_id',
  CoreParentSpanId = 'core_parent_span_id',
  RequestTime = 'request_time',
  Deployment = 'deployment',
  EventKind = 'event_kind',
  TotalTokens = 'total_tokens',
  DeploymentPrice = 'deployment_price',
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

// The `turns` rollup: one row per trace, with the turn's entry time, hop count, token totals, cost and
// wall-clock duration already resolved. `dial_usage_log` stays the source of a turn's span tree.
export enum TurnsField {
  ChatId = 'chat_id',
  TraceId = 'trace_id',
  FirstRequestTime = 'first_request_time',
  HopCount = 'hop_count',
  FailedHopCount = 'failed_hop_count',
  TotalTokens = 'total_tokens',
  TotalPrice = 'total_price',
  DurationMs = 'duration_ms',
}

export enum ConversationTurnField {
  TraceId = 'trace_id',
  Started = 'started',
  Hops = 'hops',
  FailedHops = 'failed_hops',
  Tokens = 'tokens',
  Cost = 'cost',
  DurationMs = 'duration_ms',
}

export interface ConversationTurnRow {
  trace_id: string;
  started: number | string | null;
  hops: number | string | null;
  failed_hops: number | string | null;
  tokens: number | string | null;
  cost: number | string | null;
  duration_ms: number | string | null;
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
  request_time: number | string | null;
  response_body_bytes: number | string | null;
  reasoning_tokens: number | string | null;
  mcp_method?: string | null;
  mcp_tool_call_name?: string | null;
  execution_path?: string[] | null;
}

export enum HopEventType {
  TurnStart = 'turn-start',
  TurnComplete = 'turn-complete',
  Text = 'text',
  ToolCall = 'tool-call',
  ToolResult = 'tool-result',
  Thinking = 'thinking',
  Empty = 'empty',
  Error = 'error',
  Session = 'session',
  Embedding = 'embedding',
  Other = 'other',
}

export interface HopEvent {
  key: string;
  line: number;
  type: HopEventType;
  label: string;
  detail: string | null;
  span: ConversationSpanRow | null;
  startedAtMs: number | null;
  tokens: number | null;
  reasoningTokens: number | null;
  cost: number | string | null;
  hops: number | null;
  durationMs: number | null;
  hasNoRecordedResult: boolean;
}

export interface ModelCallOutput {
  core_span_id: string;
  text: string | null;
  toolCalls: ModelToolRequest[];
  isUnread: boolean;
}

export interface ModelToolRequest {
  name: string;
  argumentsPreview: string | null;
}

export interface ConversationSpansPage {
  spans: ConversationSpanRow[];
  total: number | null;
  modelOutputs: ModelCallOutput[];
}

export enum SpanCategory {
  Error = 'error',
  Embedding = 'embedding',
  Retrieval = 'retrieval',
  Route = 'route',
  Deployment = 'deployment',
  Other = 'other',
}

export interface ConversationSpanNode {
  span: ConversationSpanRow;
  category: SpanCategory;
  startedAtMs: number | null;
}

export enum HopTextSuppression {
  NoResponse = 'no-response',
  SessionSetup = 'session-setup',
  Embedding = 'embedding',
}

export interface ConversationHopTexts {
  sent: string | null;
  received: string | null;
  toolCalls: string[];
}

export enum HopTextsState {
  Available = 'available',
  ColumnsUnavailable = 'columns-unavailable',
  NoBodies = 'no-bodies',
  LoadFailed = 'load-failed',
}

export interface ConversationHopBodies extends ConversationHopTexts {
  state: HopTextsState;
}

export enum MessageRole {
  User = 'user',
  Assistant = 'assistant',
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
}

export interface TranscriptBodyFields {
  isReadable: boolean;
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
}

export interface TranscriptStatePresentation {
  titleKey: string;
  hintKey: string;
  icon: TablerIcon;
  isError: boolean;
}

export interface ConversationModelBodyRow extends ConversationEntryBodyRow {
  core_span_id: string;
}

export interface ConversationTurnsResult {
  turns: ConversationTurnRow[];
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

export type ResolvedInsightFields = Partial<Record<ConversationsField, ResolvedConversationField>>;

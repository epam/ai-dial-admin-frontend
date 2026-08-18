import { QuerySortDirection, QueryValueType } from '@/src/models/analytics/query';

export enum ColumnProvenance {
  Conversations = 'conversations',
  Feedback = 'feedback',
  None = 'none',
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
}

export type ConversationListRow = ConversationRow & Record<string, ConversationScalar | undefined>;

export interface ConversationsPage {
  rows: ConversationRow[];
  total: number | null;
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
  chatIds?: string[];
  sort?: ConversationSortKey[];
  visibleFields?: string[];
}

export interface ConversationSummary {
  rated: number;
  negative: number;
}

export interface ConversationCandidateIds {
  ids: string[];
  isCapped: boolean;
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
}

// Grid-only column ids: every other column binds to a `ConversationsField`, but Rating is composed
// from the `rate_analytics` lookups and has no field on the conversations entity.
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

export interface ProvenanceGroup {
  provenance: ColumnProvenance;
  labelKey: string;
  tooltipKey: string;
  fields: ConversationColumnId[];
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
}

export enum ConversationTurnField {
  TraceId = 'trace_id',
  Started = 'started',
  Hops = 'hops',
  Tokens = 'tokens',
  Cost = 'cost',
  DurationMs = 'duration_ms',
}

export interface ConversationTurnRow {
  trace_id: string;
  started: number | string | null;
  hops: number | string | null;
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
}

export interface ConversationSpansPage {
  spans: ConversationSpanRow[];
  total: number | null;
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
  depth: number;
  category: SpanCategory;
  offsetMs: number | null;
  durationMs: number | null;
}

export interface ConversationTraceTotals {
  latencyMs: number | null;
  tokens: number;
  cost: string;
  spanCount: number;
  isFailed: boolean;
}

export enum MessageRole {
  User = 'user',
  Assistant = 'assistant',
}

export interface ConversationMessage {
  role: MessageRole;
  content: string;
}

export interface ConversationTurnsResult {
  turns: ConversationTurnRow[];
}

export enum ConversationDetailPanel {
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
}

export interface ConversationPanelDefinition {
  panel: ConversationDetailPanel;
  provenance: ColumnProvenance;
  labelKey: string;
  layout: ConversationPanelLayout;
  fields: ConversationFieldDefinition[];
}

export enum ConversationFieldState {
  Available = 'available',
  Empty = 'empty',
  Unavailable = 'unavailable',
}

export interface ResolvedConversationField {
  labelKey: string;
  state: ConversationFieldState;
  text: string;
  accentClassName?: string;
}

export enum ColumnProvenance {
  Conversations = 'conversations',
  Feedback = 'feedback',
}

export interface ConversationRow {
  chat_id: string;
  project_id: string;
  turn_count: number | string | null;
  total_tokens: number | string | null;
  total_price: number | string | null;
  last_request_time: number | string | null;
  first_request_time: number | string | null;
  rating_up: number | null;
  rating_down: number | null;
}

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

export interface ConversationFilters {
  search: string;
  startMs: number;
  endMs: number;
  feedback: FeedbackFilter;
}

export interface ConversationPageRequest extends ConversationFilters {
  offset: number;
  limit: number;
  chatIds?: string[];
}

export interface ConversationSummary {
  rated: number;
  negative: number;
}

export interface ProvenanceEntity {
  provenance: ColumnProvenance;
  name: string;
}

export enum ConversationsField {
  ChatId = 'chat_id',
  ProjectId = 'project_id',
  TurnCount = 'turn_count',
  TotalTokens = 'total_tokens',
  TotalPrice = 'total_price',
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

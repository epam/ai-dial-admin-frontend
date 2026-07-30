export enum ColumnProvenance {
  Conversation = 'conversation',
  UsageLog = 'usage_log',
  Enrichment = 'enrichment',
  Feedback = 'feedback',
}

export interface ConversationRow {
  chat_id: string;
  project: string;
  turns: number | string | null;
  tokens: number | string | null;
  cost: number | string | null;
  last_activity: number | string | null;
  first_activity: number | string | null;
  model: string | null;
  model_count: number | string | null;
  title: string | null;
  snippet: string | null;
  rating_up: number | null;
  rating_down: number | null;
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

export interface ConversationSummary {
  conversations: number;
  isTruncated: boolean;
  rated: number;
  negative: number;
  cost: string;
}

export interface ProvenanceEntity {
  provenance: ColumnProvenance;
  name: string;
  isPending?: boolean;
}

export enum ConversationField {
  ChatId = 'chat_id',
  Project = 'project',
  Turns = 'turns',
  Tokens = 'tokens',
  Cost = 'cost',
  LastActivity = 'last_activity',
  FirstActivity = 'first_activity',
  Model = 'model',
  ModelCount = 'model_count',
  Rating = 'rating',
  Title = 'title',
  Snippet = 'snippet',
}

export enum UsageLogField {
  ChatId = 'chat_id',
  TraceId = 'trace_id',
  ProjectId = 'project_id',
  RequestTime = 'request_time',
  TotalTokens = 'total_tokens',
  TotalPrice = 'total_price',
  Deployment = 'deployment',
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

export interface ProvenanceGroup {
  provenance: ColumnProvenance;
  labelKey: string;
  tooltipKey: string;
  fields: ConversationField[];
  isDerived?: boolean;
}

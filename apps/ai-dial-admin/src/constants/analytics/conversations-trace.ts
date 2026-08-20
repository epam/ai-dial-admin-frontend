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
  ProvenanceEntity,
  ProvenanceGroup,
  SpanCategory,
} from '@/src/models/analytics/conversations-trace';
import { QueryOperator, QueryValueType } from '@/src/models/analytics/query';
import { GridFilterType } from '@/src/types/grid-filter';

export const CONVERSATIONS_ENTITY = 'conversations';

export const FEEDBACK_ENTITY = 'rate_analytics';

export const USAGE_LOG_ENTITY = 'dial_usage_log';

export const TURNS_ENTITY = 'turns';

export const CONVERSATION_TURN_LIMIT = 200;

export const CONVERSATION_SPAN_LIMIT = 300;

export const FEEDBACK_CANDIDATE_LIMIT = 1000;

export const POSITIVE_RATE_EXCLUSIVE_MIN = 0;

export const CONVERSATIONS_TIME_PERIOD = '7d';

export const CONVERSATIONS_SEARCH_DEBOUNCE_MS = 400;

export const CONVERSATIONS_ROW_HEIGHT = 64;

export const CONVERSATIONS_GROUP_HEADER_HEIGHT = 32;

export const CONVERSATIONS_HEADER_HEIGHT = 38;

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
export const PROVENANCE_TEXT_CLASS: Record<ColumnProvenance, string> = {
  [ColumnProvenance.Conversations]: 'text-accent-primary',
  [ColumnProvenance.Insights]: 'text-accent-secondary',
  [ColumnProvenance.Feedback]: 'text-warning',
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

// Rendered as real AG Grid column groups, so a group's columns are adjacent and the rendered column order
// follows this list. The identity column sits under the rollup even though it reads the enrichment for its
// title: a conversation's identity is its id, and the title only labels it — its own tooltip says where the
// title comes from.
export const CONVERSATION_PROVENANCE_GROUPS: ProvenanceGroup[] = [
  {
    provenance: ColumnProvenance.Conversations,
    labelKey: ConversationsTraceI18nKey.ProvenanceConversations,
    tooltipKey: ConversationsTraceI18nKey.ProvenanceConversationsHint,
    fields: [
      ConversationsField.ChatId,
      ConversationsField.ProjectId,
      ConversationsField.UserHash,
      ConversationsField.TurnCount,
      ConversationsField.LastRequestTime,
      ConversationsField.TotalTokens,
      ConversationsField.TotalPrice,
      ConversationsField.Deployments,
    ],
  },
  {
    provenance: ColumnProvenance.Insights,
    labelKey: ConversationsTraceI18nKey.ProvenanceInsights,
    tooltipKey: ConversationsTraceI18nKey.ProvenanceInsightsHint,
    fields: [ConversationsField.InsightTopics],
  },
  {
    provenance: ColumnProvenance.Feedback,
    labelKey: ConversationsTraceI18nKey.ProvenanceFeedback,
    tooltipKey: ConversationsTraceI18nKey.ProvenanceFeedbackHint,
    fields: [ConversationColumn.Rating],
  },
];

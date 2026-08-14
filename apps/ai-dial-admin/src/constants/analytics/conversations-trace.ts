import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import {
  ColumnProvenance,
  ConversationColumn,
  ConversationDetailPanel,
  ConversationFieldFormat,
  ConversationPanelDefinition,
  ConversationPanelLayout,
  ConversationsField,
  ProvenanceEntity,
  ProvenanceGroup,
  SpanCategory,
} from '@/src/models/analytics/conversations-trace';

export const CONVERSATIONS_ENTITY = 'conversations';

export const FEEDBACK_ENTITY = 'rate_analytics';

export const USAGE_LOG_ENTITY = 'dial_usage_log';

export const CONVERSATION_TURN_LIMIT = 200;

export const CONVERSATION_SPAN_LIMIT = 300;

export const FEEDBACK_CANDIDATE_LIMIT = 1000;

export const POSITIVE_RATE_EXCLUSIVE_MIN = 0;

export const CONVERSATIONS_TIME_PERIOD = '7d';

export const CONVERSATIONS_SEARCH_DEBOUNCE_MS = 400;

export const CONVERSATIONS_ROW_HEIGHT = 64;

export const CONVERSATIONS_GROUP_HEADER_HEIGHT = 32;

export const CONVERSATIONS_HEADER_HEIGHT = 38;

export const SUMMARY_COST_PRECISION = 3;

// Below a dollar, cost is rendered at significant digits; from a dollar up, rounded and abbreviated.
export const COST_COMPACT_THRESHOLD = 1;

export const COST_SIGNIFICANT_DIGITS = 2;

export const PROVENANCE_TEXT_CLASS: Record<ColumnProvenance, string> = {
  [ColumnProvenance.Conversations]: 'text-accent-primary',
  [ColumnProvenance.Feedback]: 'text-warning',
  [ColumnProvenance.None]: 'text-secondary',
};

export const PROVENANCE_MARKER_CLASS: Record<ColumnProvenance, string> = {
  [ColumnProvenance.Conversations]: 'bg-accent-primary',
  [ColumnProvenance.Feedback]: 'bg-warning',
  [ColumnProvenance.None]: 'bg-layer-4',
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
      {
        labelKey: ConversationsTraceI18nKey.DetailDuration,
        column: ConversationsField.DurationMs,
        format: ConversationFieldFormat.Duration,
      },
      {
        labelKey: ConversationsTraceI18nKey.DetailAvgDuration,
        column: ConversationsField.AvgDurationMs,
        format: ConversationFieldFormat.Duration,
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
      { labelKey: ConversationsTraceI18nKey.DetailTrace },
      { labelKey: ConversationsTraceI18nKey.DetailDeployment },
      { labelKey: ConversationsTraceI18nKey.DetailRegion },
    ],
  },
];

export const CONVERSATION_SOURCE_ENTITIES: ProvenanceEntity[] = [
  { provenance: ColumnProvenance.Conversations, name: CONVERSATIONS_ENTITY },
  { provenance: ColumnProvenance.Feedback, name: FEEDBACK_ENTITY },
];

export const CONVERSATION_PROVENANCE_GROUPS: ProvenanceGroup[] = [
  {
    provenance: ColumnProvenance.Conversations,
    labelKey: ConversationsTraceI18nKey.ProvenanceConversations,
    tooltipKey: ConversationsTraceI18nKey.ProvenanceConversationsHint,
    fields: [
      ConversationsField.ChatId,
      ConversationsField.ProjectId,
      ConversationsField.TurnCount,
      ConversationsField.LastRequestTime,
      ConversationsField.TotalTokens,
      ConversationsField.TotalPrice,
    ],
  },
  {
    provenance: ColumnProvenance.Feedback,
    labelKey: ConversationsTraceI18nKey.ProvenanceFeedback,
    tooltipKey: ConversationsTraceI18nKey.ProvenanceFeedbackHint,
    fields: [ConversationColumn.Rating],
  },
];

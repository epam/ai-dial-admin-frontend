import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import {
  ColumnProvenance,
  ConversationField,
  ProvenanceEntity,
  ProvenanceGroup,
} from '@/src/models/analytics/conversations-trace';

export const CONVERSATIONS_ENTITY = 'dial_usage_log';

export const FEEDBACK_ENTITY = 'rate_analytics';

export const CONVERSATION_PAGE_SIZE = 20;

export const FEEDBACK_CANDIDATE_LIMIT = 1000;

export const POSITIVE_RATE_EXCLUSIVE_MIN = 0;

export const CONVERSATIONS_TIME_PERIOD = '7d';

export const CONVERSATIONS_SEARCH_DEBOUNCE_MS = 400;

export const CONVERSATIONS_ROW_HEIGHT = 64;

export const CONVERSATION_SUMMARY_ENRICHMENT = 'conversation_summary';

export const SUMMARY_ENRICHMENT_FIELDS = {
  title: `${CONVERSATION_SUMMARY_ENRICHMENT}.${ConversationField.Title}`,
  snippet: `${CONVERSATION_SUMMARY_ENRICHMENT}.${ConversationField.Snippet}`,
};

export const USE_CONVERSATION_SUMMARY_ENRICHMENT: boolean = false;

export const CONVERSATIONS_GROUP_HEADER_HEIGHT = 32;

export const CONVERSATIONS_HEADER_HEIGHT = 38;

export const SUMMARY_COST_PRECISION = 3;

// Below a dollar, cost is rendered at significant digits; from a dollar up, rounded and abbreviated.
export const COST_COMPACT_THRESHOLD = 1;

export const COST_SIGNIFICANT_DIGITS = 2;

export const MODEL_DOT_CLASSES = ['bg-accent-secondary', 'bg-accent-tertiary', 'bg-accent-primary'];

export const PROVENANCE_TEXT_CLASS: Record<ColumnProvenance, string> = {
  [ColumnProvenance.Conversation]: 'text-secondary',
  [ColumnProvenance.UsageLog]: 'text-accent-primary',
  [ColumnProvenance.Enrichment]: 'text-accent-secondary',
  [ColumnProvenance.Feedback]: 'text-warning',
};

export const CONVERSATION_SOURCE_ENTITIES: ProvenanceEntity[] = [
  { provenance: ColumnProvenance.UsageLog, name: CONVERSATIONS_ENTITY },
  { provenance: ColumnProvenance.Feedback, name: FEEDBACK_ENTITY },
];

export const CONVERSATION_ENRICHMENT_ENTITY: ProvenanceEntity = {
  provenance: ColumnProvenance.Enrichment,
  name: CONVERSATION_SUMMARY_ENRICHMENT,
  isPending: true,
};

export const CONVERSATION_PROVENANCE_GROUPS: ProvenanceGroup[] = [
  {
    provenance: ColumnProvenance.Enrichment,
    labelKey: ConversationsTraceI18nKey.ProvenanceConversation,
    tooltipKey: ConversationsTraceI18nKey.ProvenanceConversationHint,
    fields: [ConversationField.ChatId],
    isDerived: true,
  },
  {
    provenance: ColumnProvenance.UsageLog,
    labelKey: ConversationsTraceI18nKey.ProvenanceUsageLog,
    tooltipKey: ConversationsTraceI18nKey.ProvenanceUsageLogHint,
    fields: [
      ConversationField.Project,
      ConversationField.Turns,
      ConversationField.LastActivity,
      ConversationField.Tokens,
      ConversationField.Cost,
    ],
  },
  {
    provenance: ColumnProvenance.Feedback,
    labelKey: ConversationsTraceI18nKey.ProvenanceFeedback,
    tooltipKey: ConversationsTraceI18nKey.ProvenanceFeedbackHint,
    fields: [ConversationField.Rating],
  },
];

import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import {
  ColumnProvenance,
  ConversationColumn,
  ConversationsField,
  ProvenanceEntity,
  ProvenanceGroup,
} from '@/src/models/analytics/conversations-trace';

export const CONVERSATIONS_ENTITY = 'conversations';

export const FEEDBACK_ENTITY = 'rate_analytics';

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
};

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

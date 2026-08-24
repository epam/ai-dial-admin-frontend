import {
  CONVERSATION_INSIGHT_FIELDS,
  INSIGHT_BADGE_NEUTRAL_CLASS,
  RESOLUTION_BADGE_CLASS,
  SENTIMENT_BADGE_CLASS,
} from '@/src/constants/analytics/conversations-trace';
import {
  ConversationDetailRow,
  ConversationInsightsState,
  ConversationsField,
  ResolvedInsightFields,
} from '@/src/models/analytics/conversations-trace';
import { resolveConversationField } from '@/src/utils/analytics/conversation-detail-fields';

export const conversationInsightsState = (record: ConversationDetailRow): ConversationInsightsState => {
  const title = record[ConversationsField.InsightTitle];

  if (title === undefined) {
    return ConversationInsightsState.EnrichmentUnavailable;
  }

  return title === null || title === '' ? ConversationInsightsState.NotEvaluated : ConversationInsightsState.Available;
};

export const resolveInsightFields = (record: ConversationDetailRow): ResolvedInsightFields =>
  CONVERSATION_INSIGHT_FIELDS.reduce<ResolvedInsightFields>(
    (resolved, definition) => ({
      ...resolved,
      [definition.column as ConversationsField]: resolveConversationField(definition, record),
    }),
    {},
  );

export const sentimentBadgeClass = (value: string): string =>
  SENTIMENT_BADGE_CLASS[value] ?? INSIGHT_BADGE_NEUTRAL_CLASS;

export const resolutionBadgeClass = (value: string): string =>
  RESOLUTION_BADGE_CLASS[value] ?? INSIGHT_BADGE_NEUTRAL_CLASS;

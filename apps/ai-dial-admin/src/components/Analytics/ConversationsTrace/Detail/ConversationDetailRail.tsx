'use client';

import { IconDatabase, IconGauge, IconMessage2, IconSparkles } from '@tabler/icons-react';
import { FC, ReactNode, memo } from 'react';

import ConversationDetailPanel from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationDetailPanel';
import ConversationRailShell from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationRailShell';
import RatingCounts from '@/src/components/Analytics/ConversationsTrace/RatingCounts';
import ConversationFeedbackPanel from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationFeedbackPanel';
import ConversationFieldRows from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationFieldRows';
import ConversationInsightsPanel from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationInsightsPanel';
import {
  CONVERSATION_DETAIL_PANELS,
  CONVERSATION_FEEDBACK_PANEL,
  CONVERSATION_INSIGHTS_PANEL,
  INSIGHTS_ABSENCE_KEY,
  PROVENANCE_TEXT_CLASS,
} from '@/src/constants/analytics/conversations-trace';
import { useI18n } from '@/src/locales/client';
import {
  ConversationDetailPanel as Panel,
  ConversationDetailRow,
  ConversationFeedbackRow,
  ConversationInsightsState,
  ConversationRatingCounts,
} from '@/src/models/analytics/conversations-trace';
import { resolveConversationField } from '@/src/utils/analytics/conversation-detail-fields';
import { conversationInsightsState, resolveInsightFields } from '@/src/utils/analytics/conversation-insights';

const ICON_SIZE = 16;

const PANEL_ICON: Record<Panel, ReactNode> = {
  [Panel.Insights]: <IconSparkles size={ICON_SIZE} aria-hidden />,
  [Panel.Usage]: <IconGauge size={ICON_SIZE} aria-hidden />,
  [Panel.Feedback]: <IconMessage2 size={ICON_SIZE} aria-hidden />,
  [Panel.Metadata]: <IconDatabase size={ICON_SIZE} aria-hidden />,
};

interface Props {
  conversation: ConversationDetailRow;
  feedback: ConversationFeedbackRow[];
  feedbackTotal: number | null;
  ratings: ConversationRatingCounts | null;
  isCommentTextReadable: boolean;
}

const ConversationDetailRail: FC<Props> = ({
  conversation,
  feedback,
  feedbackTotal,
  ratings,
  isCommentTextReadable,
}) => {
  const t = useI18n();
  const insightsState = conversationInsightsState(conversation);

  return (
    <ConversationRailShell className="flex-col gap-4">
      {insightsState === ConversationInsightsState.Available ? (
        <ConversationDetailPanel
          icon={PANEL_ICON[Panel.Insights]}
          iconClassName={PROVENANCE_TEXT_CLASS[CONVERSATION_INSIGHTS_PANEL.provenance]}
          title={t(CONVERSATION_INSIGHTS_PANEL.labelKey)}
          source={CONVERSATION_INSIGHTS_PANEL.sourceEntity}
        >
          <ConversationInsightsPanel fields={resolveInsightFields(conversation)} />
        </ConversationDetailPanel>
      ) : (
        <p className="text-secondary dial-small-text">{t(INSIGHTS_ABSENCE_KEY[insightsState])}</p>
      )}
      {CONVERSATION_DETAIL_PANELS.map(({ panel, sourceEntity, provenance, labelKey, layout, fields }) => (
        <ConversationDetailPanel
          key={panel}
          icon={PANEL_ICON[panel]}
          iconClassName={PROVENANCE_TEXT_CLASS[provenance]}
          title={t(labelKey)}
          source={sourceEntity}
        >
          <ConversationFieldRows
            fields={fields.map((definition) => resolveConversationField(definition, conversation))}
            layout={layout}
          />
        </ConversationDetailPanel>
      ))}
      <ConversationDetailPanel
        icon={PANEL_ICON[Panel.Feedback]}
        iconClassName={PROVENANCE_TEXT_CLASS[CONVERSATION_FEEDBACK_PANEL.provenance]}
        title={t(CONVERSATION_FEEDBACK_PANEL.labelKey)}
        source={CONVERSATION_FEEDBACK_PANEL.sourceEntity}
      >
        <div className="flex flex-col gap-3">
          {ratings && <RatingCounts counts={ratings} />}
          <ConversationFeedbackPanel
            rows={feedback}
            total={feedbackTotal}
            isCommentTextReadable={isCommentTextReadable}
          />
        </div>
      </ConversationDetailPanel>
    </ConversationRailShell>
  );
};

// Memoized because it sits beside both views and is identical in each: switching Chat to Trace changes none
// of its props, so re-rendering the panels of resolved fields for it would be work with no output.
export default memo(ConversationDetailRail);

'use client';

import { IconDatabase, IconGauge, IconMessage2 } from '@tabler/icons-react';
import { FC, ReactNode } from 'react';

import ConversationDetailPanel from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationDetailPanel';
import ConversationRailShell from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationRailShell';
import RatingCounts from '@/src/components/Analytics/ConversationsTrace/RatingCounts';
import ConversationFeedbackPanel from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationFeedbackPanel';
import ConversationFieldRows from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationFieldRows';
import {
  CONVERSATION_DETAIL_PANELS,
  CONVERSATIONS_ENTITY,
  FEEDBACK_ENTITY,
  PROVENANCE_TEXT_CLASS,
} from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import {
  ColumnProvenance,
  ConversationDetailPanel as Panel,
  ConversationDetailRow,
  ConversationFeedbackRow,
  RatingCounts as RatingCountsModel,
} from '@/src/models/analytics/conversations-trace';
import { resolveConversationField } from '@/src/utils/analytics/conversation-detail-fields';

const ICON_SIZE = 16;

const PANEL_ICON: Record<Panel, ReactNode> = {
  [Panel.Usage]: <IconGauge size={ICON_SIZE} aria-hidden />,
  [Panel.Feedback]: <IconMessage2 size={ICON_SIZE} aria-hidden />,
  [Panel.Metadata]: <IconDatabase size={ICON_SIZE} aria-hidden />,
};

const SOURCE_LABEL: Record<ColumnProvenance, string> = {
  [ColumnProvenance.Conversations]: CONVERSATIONS_ENTITY,
  [ColumnProvenance.Feedback]: FEEDBACK_ENTITY,
  [ColumnProvenance.None]: '',
};

interface Props {
  conversation: ConversationDetailRow;
  feedback: ConversationFeedbackRow[];
  feedbackTotal: number | null;
  ratings: RatingCountsModel;
}

const ConversationDetailRail: FC<Props> = ({ conversation, feedback, feedbackTotal, ratings }) => {
  const t = useI18n();

  return (
    <ConversationRailShell className="flex-col gap-4">
      {CONVERSATION_DETAIL_PANELS.map(({ panel, provenance, labelKey, layout, fields }) => (
        <ConversationDetailPanel
          key={panel}
          icon={PANEL_ICON[panel]}
          iconClassName={PROVENANCE_TEXT_CLASS[provenance]}
          title={t(labelKey)}
          source={SOURCE_LABEL[provenance]}
        >
          <ConversationFieldRows
            fields={fields.map((definition) => resolveConversationField(definition, conversation))}
            layout={layout}
          />
        </ConversationDetailPanel>
      ))}
      <ConversationDetailPanel
        icon={PANEL_ICON[Panel.Feedback]}
        iconClassName={PROVENANCE_TEXT_CLASS[ColumnProvenance.Feedback]}
        title={t(ConversationsTraceI18nKey.DetailPanelFeedback)}
        source={SOURCE_LABEL[ColumnProvenance.Feedback]}
      >
        <div className="flex flex-col gap-3">
          <RatingCounts ratingUp={ratings.rating_up ?? 0} ratingDown={ratings.rating_down ?? 0} />
          <ConversationFeedbackPanel rows={feedback} total={feedbackTotal} />
        </div>
      </ConversationDetailPanel>
    </ConversationRailShell>
  );
};

export default ConversationDetailRail;

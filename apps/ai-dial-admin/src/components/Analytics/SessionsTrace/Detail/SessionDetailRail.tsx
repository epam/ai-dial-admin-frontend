'use client';

import { IconDatabase, IconGauge, IconMessage2, IconSparkles } from '@tabler/icons-react';
import { FC, ReactNode, memo } from 'react';

import SessionDetailPanel from '@/src/components/Analytics/SessionsTrace/Detail/SessionDetailPanel';
import SessionRailShell from '@/src/components/Analytics/SessionsTrace/Detail/SessionRailShell';
import RatingCounts from '@/src/components/Analytics/SessionsTrace/RatingCounts';
import SessionFeedbackPanel from '@/src/components/Analytics/SessionsTrace/Detail/SessionFeedbackPanel';
import SessionFieldRows from '@/src/components/Analytics/SessionsTrace/Detail/SessionFieldRows';
import SessionInsightsPanel from '@/src/components/Analytics/SessionsTrace/Detail/SessionInsightsPanel';
import {
  SESSION_DETAIL_PANELS,
  SESSION_FEEDBACK_PANEL,
  SESSION_INSIGHTS_PANEL,
  INSIGHTS_ABSENCE_KEY,
  PROVENANCE_TEXT_CLASS,
} from '@/src/constants/analytics/sessions-trace';
import { useI18n } from '@/src/locales/client';
import {
  SessionDetailPanel as Panel,
  SessionDetailRow,
  SessionFeedbackRow,
  SessionInsightField,
  SessionInsightsState,
  SessionRatingCounts,
} from '@/src/models/analytics/sessions-trace';
import { resolveSessionField } from '@/src/utils/analytics/session-detail-fields';
import { sessionInsightsState } from '@/src/utils/analytics/session-insights';

const ICON_SIZE = 16;

const PANEL_ICON: Record<Panel, ReactNode> = {
  [Panel.Insights]: <IconSparkles size={ICON_SIZE} aria-hidden />,
  [Panel.Usage]: <IconGauge size={ICON_SIZE} aria-hidden />,
  [Panel.Feedback]: <IconMessage2 size={ICON_SIZE} aria-hidden />,
  [Panel.Metadata]: <IconDatabase size={ICON_SIZE} aria-hidden />,
};

interface Props {
  session: SessionDetailRow;
  insightColumns: SessionInsightField[];
  feedback: SessionFeedbackRow[];
  feedbackTotal: number | null;
  ratings: SessionRatingCounts | null;
  isCommentTextReadable: boolean;
}

const SessionDetailRail: FC<Props> = ({
  session,
  insightColumns,
  feedback,
  feedbackTotal,
  ratings,
  isCommentTextReadable,
}) => {
  const t = useI18n();
  const insightsState = sessionInsightsState(session, insightColumns);

  return (
    <SessionRailShell className="flex-col gap-4 overflow-y-auto">
      {insightsState === SessionInsightsState.Available ? (
        <SessionDetailPanel
          icon={PANEL_ICON[Panel.Insights]}
          iconClassName={PROVENANCE_TEXT_CLASS[SESSION_INSIGHTS_PANEL.provenance]}
          title={t(SESSION_INSIGHTS_PANEL.labelKey)}
          source={SESSION_INSIGHTS_PANEL.sourceEntity}
        >
          <SessionInsightsPanel session={session} columns={insightColumns} />
        </SessionDetailPanel>
      ) : (
        <p className="text-secondary dial-small-text">{t(INSIGHTS_ABSENCE_KEY[insightsState])}</p>
      )}
      {SESSION_DETAIL_PANELS.map(({ panel, sourceEntity, provenance, labelKey, layout, fields }) => (
        <SessionDetailPanel
          key={panel}
          icon={PANEL_ICON[panel]}
          iconClassName={PROVENANCE_TEXT_CLASS[provenance]}
          title={t(labelKey)}
          source={sourceEntity}
        >
          <SessionFieldRows
            fields={fields.map((definition) => resolveSessionField(definition, session))}
            layout={layout}
          />
        </SessionDetailPanel>
      ))}
      <SessionDetailPanel
        icon={PANEL_ICON[Panel.Feedback]}
        iconClassName={PROVENANCE_TEXT_CLASS[SESSION_FEEDBACK_PANEL.provenance]}
        title={t(SESSION_FEEDBACK_PANEL.labelKey)}
        source={SESSION_FEEDBACK_PANEL.sourceEntity}
      >
        <div className="flex flex-col gap-3">
          {ratings && <RatingCounts counts={ratings} />}
          <SessionFeedbackPanel rows={feedback} total={feedbackTotal} isCommentTextReadable={isCommentTextReadable} />
        </div>
      </SessionDetailPanel>
    </SessionRailShell>
  );
};

// Memoized because it sits beside both views and is identical in each: switching Chat to Trace changes none
// of its props, so re-rendering the panels of resolved fields for it would be work with no output.
export default memo(SessionDetailRail);

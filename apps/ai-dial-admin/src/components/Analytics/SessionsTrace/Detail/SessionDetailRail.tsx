'use client';

import { IconDatabase, IconGauge, IconMessage2, IconSparkles } from '@tabler/icons-react';
import { FC, ReactNode, memo, useMemo } from 'react';

import SessionDetailPanel from '@/src/components/Analytics/SessionsTrace/Detail/SessionDetailPanel';
import SessionRailShell from '@/src/components/Analytics/SessionsTrace/Detail/SessionRailShell';
import RatingCounts from '@/src/components/Analytics/SessionsTrace/RatingCounts';
import SessionFeedbackPanel from '@/src/components/Analytics/SessionsTrace/Detail/SessionFeedbackPanel';
import SessionFieldRows from '@/src/components/Analytics/SessionsTrace/Detail/SessionFieldRows';
import SessionRecordJson from '@/src/components/Analytics/SessionsTrace/Detail/SessionRecordJson';
import SpanFieldsSection from '@/src/components/Analytics/SessionsTrace/Detail/SpanFieldsSection';
import SessionInsightsPanel from '@/src/components/Analytics/SessionsTrace/Detail/SessionInsightsPanel';
import {
  SESSION_DETAIL_PANELS,
  SESSION_FEEDBACK_PANEL,
  SESSION_INSIGHTS_PANEL,
  INSIGHTS_ABSENCE_KEY,
  PROVENANCE_TEXT_CLASS,
  SESSION_FIELD_LABEL_KEY,
  SESSION_GROUP_SUMMARY_FIELD,
  SESSION_METADATA_PANEL,
} from '@/src/constants/analytics/sessions-trace';
import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import {
  SessionDetailPanel as Panel,
  SessionDetailRow,
  SessionFeedbackRow,
  SessionInsightField,
  SessionInsightsState,
  SessionRatingCounts,
  SpanFieldGroup,
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
  metadataGroups: SpanFieldGroup[];
  feedback: SessionFeedbackRow[];
  feedbackTotal: number | null;
  ratings: SessionRatingCounts | null;
  isCommentTextReadable: boolean;
}

const SessionDetailRail: FC<Props> = ({
  session,
  insightColumns,
  metadataGroups,
  feedback,
  feedbackTotal,
  ratings,
  isCommentTextReadable,
}) => {
  const t = useI18n();
  const insightsState = sessionInsightsState(session, insightColumns);
  // The schema's own label unless this view states the column more exactly: `success_count` counts turns with
  // at least one successful hop, which the catalog's name does not say.
  const groups = useMemo(
    () =>
      metadataGroups.map((group) => ({
        ...group,
        fields: group.fields.map((field) => {
          const labelKey = SESSION_FIELD_LABEL_KEY[field.name];

          return labelKey ? { ...field, label: t(labelKey) } : field;
        }),
      })),
    [metadataGroups, t],
  );

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
        icon={PANEL_ICON[Panel.Metadata]}
        iconClassName={PROVENANCE_TEXT_CLASS[SESSION_METADATA_PANEL.provenance]}
        title={t(SESSION_METADATA_PANEL.labelKey)}
        source={SESSION_METADATA_PANEL.sourceEntity}
        action={<SessionRecordJson session={session} />}
        isFramed={groups.length === 0}
      >
        {groups.length > 0 ? (
          <SpanFieldsSection
            groups={groups}
            row={session as unknown as Record<string, unknown>}
            isRecord
            summaryFields={SESSION_GROUP_SUMMARY_FIELD}
          />
        ) : (
          <p className="text-secondary dial-tiny-text">{t(SessionsTraceI18nKey.DetailFieldsUnavailable)}</p>
        )}
      </SessionDetailPanel>
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

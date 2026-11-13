'use client';

import { IconDatabase, IconGauge, IconMessage2, IconSparkles } from '@tabler/icons-react';
import { FC, ReactNode, memo, useMemo } from 'react';

import SessionDetailPanel from '@/src/components/Analytics/SessionsTrace/Detail/SessionDetailPanel';
import SessionRailShell from '@/src/components/Analytics/SessionsTrace/Detail/SessionRailShell';
import SessionFeedbackPanel from '@/src/components/Analytics/SessionsTrace/Detail/SessionFeedbackPanel';
import SessionFieldRows from '@/src/components/Analytics/SessionsTrace/Detail/SessionFieldRows';
import SessionRecordJson from '@/src/components/Analytics/SessionsTrace/Detail/SessionRecordJson';
import SpanFieldsSection from '@/src/components/Analytics/SessionsTrace/Detail/SpanFieldsSection';
import SessionEnrichmentPanel from '@/src/components/Analytics/SessionsTrace/Detail/SessionEnrichmentPanel';
import {
  SESSION_DETAIL_PANELS,
  SESSION_FEEDBACK_PANEL,
  INSIGHTS_ABSENCE_KEY,
  PROVENANCE_TEXT_CLASS,
  SESSION_FIELD_LABEL_KEY,
  SESSION_GROUP_SUMMARY_FIELD,
  SESSION_METADATA_PANEL,
} from '@/src/constants/analytics/sessions-trace';
import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { SessionsSource } from '@/src/models/analytics/sessions-source';
import {
  ColumnProvenance,
  SessionDetailPanel as Panel,
  SessionDetailRow,
  SessionEnrichmentPanel as EnrichmentPanel,
  SessionFeedbackPage,
  SessionInsightsState,
  SpanFieldGroup,
} from '@/src/models/analytics/sessions-trace';
import {
  resolveSessionField,
  roleScopedPanels,
  sessionRatingFigures,
} from '@/src/utils/analytics/session-detail-fields';
import { enrichmentSummaryText, sessionInsightsState } from '@/src/utils/analytics/session-insights';

const ICON_SIZE = 16;

const PANEL_ICON: Record<Panel, ReactNode> = {
  [Panel.Insights]: <IconSparkles size={ICON_SIZE} aria-hidden />,
  [Panel.Usage]: <IconGauge size={ICON_SIZE} aria-hidden />,
  [Panel.Feedback]: <IconMessage2 size={ICON_SIZE} aria-hidden />,
  [Panel.Metadata]: <IconDatabase size={ICON_SIZE} aria-hidden />,
};

interface Props {
  session: SessionDetailRow;
  source: SessionsSource;
  enrichmentPanels: EnrichmentPanel[];
  enrichmentProvenance: Record<string, ColumnProvenance>;
  metadataGroups: SpanFieldGroup[];
  feedback: SessionFeedbackPage | null;
}

const SessionDetailRail: FC<Props> = ({
  session,
  source,
  enrichmentPanels,
  enrichmentProvenance,
  metadataGroups,
  feedback,
}) => {
  const t = useI18n();
  const ratings = sessionRatingFigures(session);
  const detailPanels = useMemo(() => roleScopedPanels(SESSION_DETAIL_PANELS, source), [source]);
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
      {detailPanels.map(({ panel, provenance, labelKey, layout, fields }) => (
        <SessionDetailPanel
          key={panel}
          icon={PANEL_ICON[panel]}
          iconClassName={PROVENANCE_TEXT_CLASS[provenance]}
          title={t(labelKey)}
          source={source.baseTable}
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
        source={source.baseTable}
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
      {source.ratingEnrichment && (
        <SessionDetailPanel
          icon={PANEL_ICON[Panel.Feedback]}
          iconClassName={PROVENANCE_TEXT_CLASS[SESSION_FEEDBACK_PANEL.provenance]}
          title={t(SESSION_FEEDBACK_PANEL.labelKey)}
          source={source.ratingEnrichment}
        >
          <SessionFeedbackPanel ratings={ratings} feedback={feedback} />
        </SessionDetailPanel>
      )}
      {enrichmentPanels.map((panel) => {
        const state = sessionInsightsState(session, panel.fields);
        const isAvailable = state === SessionInsightsState.Available;
        const hasGroups = panel.groups.length > 0;

        if (isAvailable && !hasGroups && !enrichmentSummaryText(session, panel)) {
          return null;
        }

        return (
          <SessionDetailPanel
            key={panel.namespace}
            icon={PANEL_ICON[Panel.Insights]}
            iconClassName={PROVENANCE_TEXT_CLASS[enrichmentProvenance[panel.namespace] ?? ColumnProvenance.Other]}
            title={panel.title}
            hint={panel.description}
            isFramed={!isAvailable || !hasGroups}
          >
            {isAvailable ? (
              <SessionEnrichmentPanel session={session} panel={panel} />
            ) : (
              <p className="text-secondary dial-small-text">{t(INSIGHTS_ABSENCE_KEY[state])}</p>
            )}
          </SessionDetailPanel>
        );
      })}
    </SessionRailShell>
  );
};

// Memoized because it sits beside both views and is identical in each: switching Chat to Trace changes none
// of its props, so re-rendering the panels of resolved fields for it would be work with no output.
export default memo(SessionDetailRail);

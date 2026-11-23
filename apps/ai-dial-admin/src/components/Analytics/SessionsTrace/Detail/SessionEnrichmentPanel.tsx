'use client';

import { FC } from 'react';

import SpanFieldsSection from '@/src/components/Analytics/SessionsTrace/Detail/SpanFieldsSection';
import ExpandableText from '@/src/components/Common/ExpandableText/ExpandableText';
import { SessionDetailRow, SessionEnrichmentPanel as Panel } from '@/src/models/analytics/sessions-trace';
import { enrichmentSummaryText } from '@/src/utils/analytics/session-insights';

const SUMMARY_LINES = 2;
const NO_GROUP_PREVIEW_FIELDS: Record<string, string> = {};

interface Props {
  session: SessionDetailRow;
  panel: Panel;
}

const SessionEnrichmentPanel: FC<Props> = ({ session, panel }) => {
  const summary = enrichmentSummaryText(session, panel);

  const summaryBlock =
    panel.summary && summary ? (
      <div className="flex flex-col gap-1">
        <span className="text-secondary dial-tiny-text">{panel.summary.label}</span>
        <ExpandableText lines={SUMMARY_LINES} className="text-primary dial-small-text">
          {summary}
        </ExpandableText>
      </div>
    ) : null;

  return panel.groups.length > 0 ? (
    <SpanFieldsSection
      groups={panel.groups}
      row={session as unknown as Record<string, unknown>}
      isRecord
      summaryFields={NO_GROUP_PREVIEW_FIELDS}
      lead={summaryBlock}
    />
  ) : (
    summaryBlock
  );
};

export default SessionEnrichmentPanel;

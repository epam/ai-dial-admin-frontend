'use client';

import { FC } from 'react';

import SessionTermList from '@/src/components/Analytics/SessionsTrace/Detail/SessionTermList';
import { SessionDetailRow, SessionInsightField, SessionsField } from '@/src/models/analytics/sessions-trace';
import { insightValueText } from '@/src/utils/analytics/session-insights';

// The two columns the panel treats differently from the rest, and the only two it names at all. The title is
// the view's heading, so restating it here would state one value twice; the summary is several sentences the
// schema puts no length on, which a label-and-value row is the wrong shape for. Every other column — the ones
// this frontend knows and the ones it does not — renders the same way.
const HEADING_FIELD: string = SessionsField.InsightTitle;
const PROSE_FIELD: string = SessionsField.InsightSummary;

interface Props {
  session: SessionDetailRow;
  columns: SessionInsightField[];
}

const SessionInsightsPanel: FC<Props> = ({ session, columns }) => {
  const prose = columns.find(({ name }) => name === PROSE_FIELD);
  const summary = prose ? insightValueText(session, prose) : '';

  // A column the record carries no value for is dropped rather than rendered blank. The enrichment keeps its
  // superseded columns and leaves them null on rows a later evaluator labelled, so rendering every reported
  // column would fill the panel with rows whose only meaning is "this row is newer than that column".
  const terms = columns
    .filter(({ name }) => name !== HEADING_FIELD && name !== PROSE_FIELD)
    .map((column) => ({
      key: column.name,
      label: column.label,
      hint: column.hint,
      value: insightValueText(session, column),
    }))
    .filter(({ value }) => value !== '');

  return (
    <div className="flex flex-col gap-3">
      {summary && <p className="text-primary dial-small-text">{summary}</p>}
      {terms.length > 0 && <SessionTermList terms={terms} />}
    </div>
  );
};

export default SessionInsightsPanel;

'use client';

import { FC } from 'react';

import FieldCaveat from '@/src/components/Analytics/ConversationsTrace/FieldCaveat';
import {
  ConversationDetailRow,
  ConversationInsightField,
  ConversationsField,
} from '@/src/models/analytics/conversations-trace';
import { insightValueText } from '@/src/utils/analytics/conversation-insights';

// The two columns the panel treats differently from the rest, and the only two it names at all. The title is
// the view's heading, so restating it here would state one value twice; the summary is several sentences the
// schema puts no length on, which a label-and-value row is the wrong shape for. Every other column — the ones
// this frontend knows and the ones it does not — renders the same way.
const HEADING_FIELD: string = ConversationsField.InsightTitle;
const PROSE_FIELD: string = ConversationsField.InsightSummary;

interface TermProps {
  label: string;
  hint?: string;
  text: string;
}

const InsightTerm: FC<TermProps> = ({ label, hint, text }) => (
  <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-4">
    <dt className="flex items-center gap-1 text-secondary dial-tiny-text">
      {label}
      {/* The service's own description of the column, which is the only explanation available for a field
          this frontend has never heard of. It hangs off a focusable control so it reaches a keyboard. */}
      {hint && <FieldCaveat caveat={hint} />}
    </dt>
    {/* Wrapped rather than clipped: nothing bounds an insight value's length, so a value slot sized for a
        short one would silently truncate whatever the evaluator writes. */}
    <dd className="min-w-0 break-words text-right text-primary dial-tiny-text">{text}</dd>
  </div>
);

interface Props {
  conversation: ConversationDetailRow;
  columns: ConversationInsightField[];
}

const ConversationInsightsPanel: FC<Props> = ({ conversation, columns }) => {
  const prose = columns.find(({ name }) => name === PROSE_FIELD);
  const summary = prose ? insightValueText(conversation, prose) : '';

  // A column the record carries no value for is dropped rather than rendered blank. The enrichment keeps its
  // superseded columns and leaves them null on rows a later evaluator labelled, so rendering every reported
  // column would fill the panel with rows whose only meaning is "this row is newer than that column".
  const terms = columns
    .filter(({ name }) => name !== HEADING_FIELD && name !== PROSE_FIELD)
    .map((column) => ({ column, text: insightValueText(conversation, column) }))
    .filter(({ text }) => text !== '');

  return (
    <div className="flex flex-col gap-3">
      {summary && <p className="text-primary dial-small-text">{summary}</p>}
      {terms.length > 0 && (
        <dl className="flex flex-col gap-1.5">
          {terms.map(({ column, text }) => (
            <InsightTerm key={column.name} label={column.label} hint={column.hint} text={text} />
          ))}
        </dl>
      )}
    </div>
  );
};

export default ConversationInsightsPanel;

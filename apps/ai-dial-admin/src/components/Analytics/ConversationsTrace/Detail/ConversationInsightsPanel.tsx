'use client';

import { FC } from 'react';

import ConversationTermList from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationTermList';
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
    .map((column) => ({
      key: column.name,
      label: column.label,
      hint: column.hint,
      value: insightValueText(conversation, column),
    }))
    .filter(({ value }) => value !== '');

  return (
    <div className="flex flex-col gap-3">
      {summary && <p className="text-primary dial-small-text">{summary}</p>}
      {terms.length > 0 && <ConversationTermList terms={terms} />}
    </div>
  );
};

export default ConversationInsightsPanel;

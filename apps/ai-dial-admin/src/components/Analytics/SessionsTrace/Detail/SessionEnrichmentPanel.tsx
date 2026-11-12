'use client';

import { FC } from 'react';

import SessionTermList from '@/src/components/Analytics/SessionsTrace/Detail/SessionTermList';
import { useI18n } from '@/src/locales/client';
import { SessionDetailRow, SessionEnrichmentPanel as Panel } from '@/src/models/analytics/sessions-trace';
import { unqualified } from '@/src/utils/analytics/session-enrichment';
import { enrichmentTagLabelKey, insightValueText } from '@/src/utils/analytics/session-insights';
import { readableWords } from '@/src/utils/analytics/session-formatting';

// The summary is several sentences the schema puts no length on, which a label-and-value row is the wrong
// shape for. The Title role's field is the view's heading, so restating it here would state one value twice.
const PROSE_FIELD = 'summary';

interface Props {
  session: SessionDetailRow;
  panel: Panel;
  headingField: string | null;
}

const SessionEnrichmentPanel: FC<Props> = ({ session, panel, headingField }) => {
  const t = useI18n();
  const prose = panel.fields.find(({ name }) => unqualified(name) === PROSE_FIELD);
  const summary = prose ? insightValueText(session, prose) : '';

  // A column the record carries no value for is dropped rather than rendered blank. An enrichment keeps its
  // superseded columns and leaves them null on rows a later evaluator labelled, so rendering every reported
  // column would fill the panel with rows whose only meaning is "this row is newer than that column".
  const groups = panel.groups
    .map(({ tag, fields }) => ({
      tag,
      terms: fields
        .filter(({ name }) => name !== headingField && name !== prose?.name)
        .map((column) => ({
          key: column.name,
          label: column.label,
          hint: column.hint,
          value: insightValueText(session, column),
        }))
        .filter(({ value }) => value !== ''),
    }))
    .filter(({ terms }) => terms.length > 0);
  const isGrouped = groups.length > 1;

  const tagLabel = (tag: string): string => {
    const labelKey = enrichmentTagLabelKey(tag);

    return labelKey ? t(labelKey) : readableWords(tag);
  };

  return (
    <div className="flex flex-col gap-3">
      {summary && <p className="text-primary dial-small-text">{summary}</p>}
      {groups.map(({ tag, terms }) => (
        <section key={tag} className="flex flex-col gap-1.5" aria-label={isGrouped && tag ? tagLabel(tag) : undefined}>
          {isGrouped && tag && <h4 className="text-secondary dial-tiny-semi-text">{tagLabel(tag)}</h4>}
          <SessionTermList terms={terms} />
        </section>
      ))}
    </div>
  );
};

export default SessionEnrichmentPanel;

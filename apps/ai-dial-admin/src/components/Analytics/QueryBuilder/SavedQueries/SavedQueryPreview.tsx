'use client';

import { FC } from 'react';

import { DialNoDataContent } from '@epam/ai-dial-ui-kit';

import { useSavedQueryLabels } from '@/src/components/Analytics/QueryBuilder/SavedQueries/use-saved-query-labels';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { SavedQuery, SavedQueryScope } from '@/src/models/analytics/saved-query';

interface Props {
  query: SavedQuery | null;
}

interface RowProps {
  label: string;
  value: string;
}

const PreviewRow: FC<RowProps> = ({ label, value }) => (
  <>
    <dt className="uppercase tracking-wide dial-tiny-text text-secondary">{label}</dt>
    <dd className="m-0 min-w-0 break-words font-mono dial-tiny-text text-primary">{value}</dd>
  </>
);

// Rendered entirely from the list entry: the service returns full saved queries, bodies included, so
// selecting a row needs no request and there is nothing here to be loading.
const SavedQueryPreview: FC<Props> = ({ query }) => {
  const t = useI18n();
  const { periodLabel, showsAsLabel } = useSavedQueryLabels();

  if (!query) return <DialNoDataContent title={t(QueryBuilderI18nKey.SavedQueriesPreviewEmpty)} />;

  // Display only, and only where it varies: under `personal` the author is always the caller, so
  // repeating it per row is noise. Under `common` an absent email gets a neutral placeholder — it is
  // often absent, and it is never compared to decide anything.
  const author =
    query.scope === SavedQueryScope.Common
      ? (query.owner_email ?? t(QueryBuilderI18nKey.SavedQueryAuthorUnknown))
      : null;

  const body = query.sql ?? (query.query ? JSON.stringify(query.query, null, 2) : '');

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
      <div className="shrink-0">
        <div className="text-primary dial-small-semi-text">{query.name}</div>
        {!!query.description && <p className="mb-0 mt-1 text-secondary dial-tiny-text">{query.description}</p>}
      </div>

      <dl className="m-0 grid shrink-0 grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
        {!!query.source && <PreviewRow label={t(QueryBuilderI18nKey.Source)} value={query.source} />}
        {!!query.tag && <PreviewRow label={t(QueryBuilderI18nKey.SavedQueryTag)} value={query.tag} />}
        <PreviewRow label={t(QueryBuilderI18nKey.SavedQueryPeriod)} value={periodLabel(query.time)} />
        <PreviewRow
          label={t(QueryBuilderI18nKey.SavedQueryShowsAs)}
          value={showsAsLabel(query.result_view, query.chart)}
        />
        {!!author && <PreviewRow label={t(QueryBuilderI18nKey.SavedQuerySavedBy)} value={author} />}
      </dl>

      {/* The body takes its natural height so the panel scrolls as one. Left to shrink it becomes its
          own vertical scroller — `overflow-x-auto` makes CSS compute `overflow-y` to `auto` as well —
          which strands the metadata above a second scrollbar. */}
      <div className="flex shrink-0 flex-col gap-1">
        <span className="uppercase tracking-wide dial-tiny-text text-secondary">
          {t(QueryBuilderI18nKey.SavedQueryBody)}
        </span>
        <pre className="m-0 shrink-0 overflow-x-auto rounded border border-primary bg-layer-1 p-2.5 font-mono dial-tiny-text text-primary">
          {body}
        </pre>
      </div>
    </div>
  );
};

export default SavedQueryPreview;

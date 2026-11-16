'use client';

import { FC, useId, useMemo } from 'react';

import { Search } from '@epam/ai-dial-ui-kit';

import QueryRow from '@/src/components/Analytics/QueryBuilder/SourcePanel/QueryRow';
import ScopeFilter from '@/src/components/Analytics/QueryBuilder/SourcePanel/ScopeFilter';
import { useSourcePanel } from '@/src/components/Analytics/QueryBuilder/SourcePanel/context';
import { SourcePanelTab } from '@/src/components/Analytics/QueryBuilder/SourcePanel/models';
import { usePreservedScroll } from '@/src/components/Analytics/QueryBuilder/SourcePanel/use-preserved-scroll';
import { filterSavedQueries } from '@/src/components/Analytics/QueryBuilder/SourcePanel/utils/source-panel';
import { EntitiesI18nKey, QuerySourcePanelI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  currentQueryId?: string;
}

const QueriesTab: FC<Props> = ({ currentQueryId }) => {
  const t = useI18n();
  const searchId = useId();
  const { queries, querySearch, onChangeQuerySearch, scopeFilter } = useSourcePanel();

  const visibleQueries = useMemo(
    () => filterSavedQueries(queries, querySearch, scopeFilter),
    [queries, querySearch, scopeFilter],
  );
  const searchLabel = t(QuerySourcePanelI18nKey.SearchQueries);
  const scroll = usePreservedScroll(SourcePanelTab.Queries);

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <Search
            id={searchId}
            value={querySearch}
            placeholder={searchLabel}
            aria-label={searchLabel}
            onChange={(value) => onChangeQuerySearch(value ?? '')}
          />
        </div>
        <ScopeFilter />
      </div>
      {!visibleQueries.length ? (
        <p className="px-3 py-2 text-secondary dial-tiny-text">
          {t(queries.length ? EntitiesI18nKey.NoResults : EntitiesI18nKey.NoQueries)}
        </p>
      ) : (
        <ul
          ref={scroll.ref}
          className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto"
          onScroll={scroll.onScroll}
        >
          {visibleQueries.map((query) => (
            <QueryRow key={query.id} query={query} isCurrent={query.id === currentQueryId} />
          ))}
        </ul>
      )}
    </>
  );
};

export default QueriesTab;

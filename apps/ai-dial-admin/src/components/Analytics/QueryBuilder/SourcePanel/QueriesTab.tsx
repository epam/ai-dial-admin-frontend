'use client';

import { FC, useId, useMemo } from 'react';

import { Search } from '@epam/ai-dial-ui-kit';

import QueryRow from '@/src/components/Analytics/QueryBuilder/SourcePanel/QueryRow';
import QueryTagGroup from '@/src/components/Analytics/QueryBuilder/SourcePanel/QueryTagGroup';
import ScopeFilter from '@/src/components/Analytics/QueryBuilder/SourcePanel/ScopeFilter';
import { useSourcePanel } from '@/src/components/Analytics/QueryBuilder/SourcePanel/context';
import { QueryRowIndent, SourcePanelTab } from '@/src/components/Analytics/QueryBuilder/SourcePanel/models';
import { usePreservedScroll } from '@/src/components/Analytics/QueryBuilder/SourcePanel/use-preserved-scroll';
import {
  filterSavedQueries,
  groupQueriesByTag,
} from '@/src/components/Analytics/QueryBuilder/SourcePanel/utils/source-panel';
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
  const tree = useMemo(() => groupQueriesByTag(visibleQueries), [visibleQueries]);
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
          className="-mr-6 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto pr-6"
          onScroll={scroll.onScroll}
        >
          {tree.groups.map((group) => (
            <QueryTagGroup key={group.tag} group={group} currentQueryId={currentQueryId} />
          ))}
          {tree.untagged.map((query) => (
            <QueryRow
              key={query.id}
              query={query}
              isCurrent={query.id === currentQueryId}
              indent={tree.groups.length ? QueryRowIndent.BesideGroups : QueryRowIndent.Root}
            />
          ))}
        </ul>
      )}
    </>
  );
};

export default QueriesTab;

'use client';

import { FC, useMemo } from 'react';

import { DialNoDataContent, DialSearch, ElementSize } from '@epam/ai-dial-ui-kit';

import SavedQueryRow from '@/src/components/Analytics/QueryBuilder/SavedQueries/SavedQueryRow';
import {
  filterSavedQueries,
  groupSavedQueriesByTag,
} from '@/src/components/Analytics/QueryBuilder/utils/saved-query-list';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { SavedQuery, SavedQueryScope } from '@/src/models/analytics/saved-query';

interface Props {
  queries: SavedQuery[];
  scope: SavedQueryScope;
  search: string;
  onChangeSearch: (value: string) => void;
  selectedId?: string;
  canDelete: boolean;
  onSelect: (query: SavedQuery) => void;
  onOpen: (query: SavedQuery) => void;
  onDelete: (query: SavedQuery) => void;
}

const SavedQueryList: FC<Props> = ({
  queries,
  scope,
  search,
  onChangeSearch,
  selectedId,
  canDelete,
  onSelect,
  onOpen,
  onDelete,
}) => {
  const t = useI18n();

  const visible = useMemo(() => filterSavedQueries(queries, search), [queries, search]);
  const groups = useMemo(() => groupSavedQueriesByTag(visible), [visible]);

  const isPersonal = scope === SavedQueryScope.Personal;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 p-3 pb-1">
        <DialSearch
          id="saved-queries-search"
          size={ElementSize.Small}
          value={search}
          placeholder={t(QueryBuilderI18nKey.SavedQueriesSearch)}
          onChange={onChangeSearch}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2 pt-1">
        {!queries.length ? (
          <DialNoDataContent
            title={t(
              isPersonal
                ? QueryBuilderI18nKey.SavedQueriesEmptyPersonalTitle
                : QueryBuilderI18nKey.SavedQueriesEmptyCommonTitle,
            )}
            description={t(
              isPersonal
                ? QueryBuilderI18nKey.SavedQueriesEmptyPersonalDescription
                : QueryBuilderI18nKey.SavedQueriesEmptyCommonDescription,
            )}
            // The default description type is larger than the title, which inverts the hierarchy in a
            // pane this narrow.
            titleClassName="dial-small-semi-text text-primary"
            descriptionClassName="dial-tiny-text text-secondary"
          />
        ) : !visible.length ? (
          <DialNoDataContent title={t(QueryBuilderI18nKey.SavedQueriesNoMatches)} />
        ) : (
          groups.map((group) => (
            <div key={group.tag ?? ''} className="mb-1">
              <div className="flex items-center gap-2 px-2 py-1.5 uppercase tracking-wide dial-tiny-semi-text text-secondary">
                <span className="min-w-0 flex-1 truncate">
                  {group.tag ?? t(QueryBuilderI18nKey.SavedQueriesUntagged)}
                </span>
                <span className="shrink-0 normal-case">{group.queries.length}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                {group.queries.map((query) => (
                  <SavedQueryRow
                    key={query.id}
                    query={query}
                    selected={query.id === selectedId}
                    canDelete={canDelete}
                    onSelect={() => onSelect(query)}
                    onOpen={() => onOpen(query)}
                    onDelete={() => onDelete(query)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SavedQueryList;

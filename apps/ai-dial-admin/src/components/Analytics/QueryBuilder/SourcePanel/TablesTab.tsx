'use client';

import { FC, useId, useMemo } from 'react';

import { Search } from '@epam/ai-dial-ui-kit';

import TableRow from '@/src/components/Analytics/QueryBuilder/SourcePanel/TableRow';
import { useSourcePanel } from '@/src/components/Analytics/QueryBuilder/SourcePanel/context';
import { SourcePanelTab } from '@/src/components/Analytics/QueryBuilder/SourcePanel/models';
import { usePreservedScroll } from '@/src/components/Analytics/QueryBuilder/SourcePanel/use-preserved-scroll';
import { filterSourceTables } from '@/src/components/Analytics/QueryBuilder/SourcePanel/utils/source-panel';
import { EntitiesI18nKey, QuerySourcePanelI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  currentTable?: string;
}

const TablesTab: FC<Props> = ({ currentTable }) => {
  const t = useI18n();
  const searchId = useId();
  const { tables, tableSearch, onChangeTableSearch } = useSourcePanel();

  const visibleTables = useMemo(() => filterSourceTables(tables, tableSearch), [tables, tableSearch]);
  const searchLabel = t(QuerySourcePanelI18nKey.SearchTables);
  const scroll = usePreservedScroll(SourcePanelTab.Tables);

  return (
    <>
      <Search
        id={searchId}
        value={tableSearch}
        placeholder={searchLabel}
        aria-label={searchLabel}
        onChange={(value) => onChangeTableSearch(value ?? '')}
      />
      {!visibleTables.length ? (
        <p className="px-3 py-2 text-secondary dial-tiny-text">
          {t(tables.length ? EntitiesI18nKey.NoResults : QuerySourcePanelI18nKey.NoTables)}
        </p>
      ) : (
        <ul
          ref={scroll.ref}
          className="-mr-6 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto pr-6"
          onScroll={scroll.onScroll}
        >
          {visibleTables.map((table) => (
            <TableRow key={table.name} table={table} isCurrent={table.name === currentTable} />
          ))}
        </ul>
      )}
    </>
  );
};

export default TablesTab;

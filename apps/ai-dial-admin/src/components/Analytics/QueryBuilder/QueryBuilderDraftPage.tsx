'use client';

import { ComponentProps, FC, useEffect } from 'react';

import { Spinner } from '@epam/ai-dial-ui-kit';

import QueryBuilderDraft from '@/src/components/Analytics/QueryBuilder/QueryBuilderDraft';
import QueryPageShell from '@/src/components/Analytics/QueryBuilder/SourcePanel/QueryPageShell';
import { useSourcePanel } from '@/src/components/Analytics/QueryBuilder/SourcePanel/context';
import { ColumnLoadStatus } from '@/src/components/Analytics/QueryBuilder/SourcePanel/models';
import { resolveDraftTable } from '@/src/components/Analytics/QueryBuilder/SourcePanel/utils/source-panel';

type Props = Pick<
  ComponentProps<typeof QueryBuilderDraft>,
  'initialEntities' | 'initialEntityName' | 'initialFields' | 'initialFunctions'
>;

const QueryBuilderDraftPage: FC<Props> = ({ initialEntities, initialEntityName, initialFields, initialFunctions }) => {
  const { draftTable, columns, onLoadColumns } = useSourcePanel();

  const table = resolveDraftTable(initialEntities, draftTable ?? initialEntityName);
  const isInitialTable = table === initialEntityName;
  const load = columns[table];
  const isLoadNeeded = !!table && !isInitialTable && !load;

  useEffect(() => {
    if (isLoadNeeded) onLoadColumns(table);
  }, [isLoadNeeded, table, onLoadColumns]);

  const isLoading = !isInitialTable && (!load || load.status === ColumnLoadStatus.Loading);

  return (
    <QueryPageShell currentTable={table}>
      {isLoading ? (
        <Spinner size={40} fullWidth />
      ) : (
        <QueryBuilderDraft
          key={`draft:${table}`}
          initialEntities={initialEntities}
          initialEntityName={table}
          initialFields={isInitialTable ? initialFields : (load?.fields ?? [])}
          initialFunctions={initialFunctions}
          name={table || undefined}
        />
      )}
    </QueryPageShell>
  );
};

export default QueryBuilderDraftPage;

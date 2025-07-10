'use client';
import { GridOptions } from 'ag-grid-community';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { emptyDataTitleMap, getEntityPath, listViewTitleMap } from '@/src/components/EntityListView/entity-list-view';
import ListView from '@/src/components/ListView/ListView';
import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { getPublicationColumns } from '@/src/constants/grid-columns/grid-columns';
import { useI18n } from '@/src/locales/client';
import { Publication } from '@/src/models/dial/publications';
import { ApplicationRoute } from '@/src/types/routes';

interface BasePublicationsListProps<T> {
  data: T[];
  route: ApplicationRoute;
}

const BasePublicationsList = <T extends Publication>({ data, route }: BasePublicationsListProps<T>) => {
  const t = useI18n();
  const router = useRouter();

  const openInNewTab = useCallback(
    (publication: Publication) => {
      window.open(`${route}/${getEntityPath(route, publication)}`, '_blank');
    },
    [route],
  );

  const gridColumns = getPublicationColumns(openInNewTab);

  const gridOptions: GridOptions = {
    onCellClicked: (e) => {
      if (e.colDef.field !== ACTIONS_COLUMN_CEL_ID) {
        router.push(`${route}/${getEntityPath(route, e.data)}`);
      }
    },
  };

  return (
    <ListView
      data={data}
      additionalGridOptions={gridOptions}
      columnDefs={gridColumns}
      title={t(listViewTitleMap[route])}
      emptyDataTitle={t(emptyDataTitleMap[route])}
      view={route}
    />
  );
};

export default BasePublicationsList;

import {
  emptyDataTitleMap,
  getEntityPath,
  getPublicationColumns,
  listViewTitleMap,
} from '@/src/components/EntityListView/entity-list-view';
import { ApplicationRoute } from '@/src/types/routes';
import ListView from '@/src/components/ListView/ListView';
import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { useI18n } from '@/src/locales/client';
import { useRouter } from 'next/navigation';
import { GridOptions } from 'ag-grid-community';
import { Publication } from '@/src/models/dial/publications';
import { useCallback } from 'react';

interface BasePublicationsListProps<T> {
  data: T[];
  route: ApplicationRoute;
  dataTestId: string;
}

const BasePublicationsList = <T extends Publication>({ data, route, dataTestId }: BasePublicationsListProps<T>) => {
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
      dataTestId={dataTestId}
    />
  );
};

export default BasePublicationsList;

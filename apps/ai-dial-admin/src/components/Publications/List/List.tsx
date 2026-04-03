'use client';
import { GridOptions } from 'ag-grid-community';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { emptyDataTitleMap, listViewTitleMap } from '@/src/components/ListView/constants';
import ListEntities from '@/src/components/ListView/List';
import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { getPublicationColumns } from '@/src/constants/grid-columns/grid-columns';
import { useI18n } from '@/src/locales/client';
import { Publication } from '@/src/models/dial/publications';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity, onOpenInNewTab } from '@/src/utils/open-in-new-tab';

interface Props<T> {
  data: T[];
  route: ApplicationRoute;
}

const PublicationsList = <T extends Publication>({ data, route }: Props<T>) => {
  const t = useI18n();
  const router = useRouter();

  const openInNewTab = useCallback(
    (publication?: Publication) => {
      onOpenInNewTab(route, publication);
    },
    [route],
  );

  const gridColumns = getPublicationColumns(openInNewTab, t);

  const gridOptions: GridOptions = {
    onCellClicked: (e) => {
      if (e.colDef.field !== ACTIONS_COLUMN_CEL_ID) {
        router.push(getUrnForEntity(route, e.data));
      }
    },
  };

  return (
    <ListEntities
      rowData={data}
      additionalGridOptions={gridOptions}
      columnDefs={gridColumns}
      listLabel={t(listViewTitleMap[route])}
      emptyDataProps={{ title: t(emptyDataTitleMap[route]) }}
      isMainListView
    />
  );
};

export default PublicationsList;

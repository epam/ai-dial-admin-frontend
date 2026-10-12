'use client';
import { GridOptions } from 'ag-grid-community';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import { onCellClicked } from '@/src/components/EntityListView/utils/on-cell-clicked';
import { emptyDataTitleMap, listViewTitleMap } from '@/src/components/ListView/constants';
import ListEntities from '@/src/components/ListView/List';
import { getPublicationColumns } from '@/src/constants/grid-columns/grid-columns';
import { useI18n } from '@/src/locales/client';
import { Publication } from '@/src/models/dial/publications';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity, onOpenInNewTab } from '@/src/utils/open-in-new-tab';

const ROUTE = ApplicationRoute.Publications;

interface Props<T> {
  data: T[];
}

const PublicationsList = <T extends Publication>({ data }: Props<T>) => {
  const t = useI18n();
  const router = useRouter();

  const openInNewTab = useCallback((publication?: Publication) => {
    onOpenInNewTab(ROUTE, publication);
  }, []);

  const gridColumns = useMemo(() => getPublicationColumns(openInNewTab, t), [openInNewTab, t]);

  const gridOptions: GridOptions = {
    onCellClicked: (e) => onCellClicked(e, ROUTE, router.push),
  };

  return (
    <ListEntities
      rowData={data}
      additionalGridOptions={gridOptions}
      columnDefs={gridColumns}
      listLabel={t(listViewTitleMap[ROUTE])}
      emptyDataProps={{ title: t(emptyDataTitleMap[ROUTE]) }}
      isMainListView
      getHref={(row) => getUrnForEntity(ROUTE, row)}
    />
  );
};

export default PublicationsList;

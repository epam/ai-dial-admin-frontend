import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { FC, useCallback, useState } from 'react';

import ListEntities from '@/src/components/ListView/List';
import { CONTAINER_EVENTS } from '@/src/constants/grid-columns/grid-columns';
import { EntitiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { KubEvent } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';

import { useGridFollowOnUpdate } from '@/src/components/Grid/hooks/use-grid-follow-on-update';
import { getRowIdById } from '@/src/components/Grid/utils';

interface Props {
  route: ApplicationRoute;
  events: KubEvent[];
}

const Events: FC<Props> = ({ route, events }) => {
  const t = useI18n();
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  const onGridReady = useCallback((event: GridReadyEvent) => {
    setGridApi(event.api);
  }, []);

  useGridFollowOnUpdate({
    gridApi,
    rowData: events,
    getRowId: getRowIdById,
  });

  return (
    <ListEntities
      rowData={events}
      columnDefs={CONTAINER_EVENTS(t)}
      listLabel={t(TabsI18nKey.Events)}
      emptyDataProps={{ title: t(EntitiesI18nKey.NoEvents) }}
      storageKey={`${route}/events`}
      isEnableColumnPanel
      isLiveData
      getRowId={getRowIdById}
      onGridReady={onGridReady}
    />
  );
};

export default Events;

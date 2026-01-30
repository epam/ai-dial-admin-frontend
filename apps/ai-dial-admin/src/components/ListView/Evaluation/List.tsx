import { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import { useCallback, useState } from 'react';

import { CellClickedEvent } from 'ag-grid-community';
import { useRouter } from 'next/navigation';

import ListView from '@/src/components/ListView/ListView';
import { ACTION_COLUMN, ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { getOpenInNewTabOperation } from '@/src/constants/grid-columns/actions';
import { useI18n } from '@/src/locales/client';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity, onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { emptyDataTitleMap, listViewTitleMap } from '../constants';
import HeaderButtons from './Header';

interface Props<T> {
  data: T[];
  names: string[];
  route: ApplicationRoute;
  baseColumns: ColDef[];
  onCreateEntity?: (entity: T) => Promise<ServerActionResponse>;
  onRemoveEntity: (entity: string) => Promise<ServerActionResponse>;
}

const EvaluationListView = <T extends object>({ names, data, baseColumns, route, onCreateEntity }: Props<T>) => {
  const t = useI18n();
  const router = useRouter();

  const [showColumnsPanel, setShowColumnsPanel] = useState(false);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  const gridOptions: GridOptions = {
    onCellClicked: (e: CellClickedEvent) => {
      if (e.colDef.field !== ACTIONS_COLUMN_CEL_ID) {
        router.push(getUrnForEntity(route, e.data));
      }
    },
  };

  const onGridReady = useCallback((api: GridApi) => {
    setGridApi(api);
  }, []);

  const onOpenInNewTabAction = useCallback(
    (entity?: T) => {
      onOpenInNewTab(route, entity);
    },
    [route],
  );

  const actionColumn = ACTION_COLUMN([
    getOpenInNewTabOperation(onOpenInNewTabAction),
    // getDuplicateOperation(onDuplicateAction), // TODO: implement duplication for evaluations
    // getDeleteOperation(onDeleteAction), // TODO: implement duplication for evaluations
  ]);

  const columnDefs = [...baseColumns, actionColumn];

  const toggleColumnsPanel = () => setShowColumnsPanel(!showColumnsPanel);

  return (
    <>
      <ListView
        data={data}
        view={route}
        columnDefs={columnDefs}
        additionalGridOptions={gridOptions}
        title={t(listViewTitleMap[route])}
        emptyDataTitle={t(emptyDataTitleMap[route])}
        showColumnsPanel
        toggleColumnsPanel={toggleColumnsPanel}
        storageKey={route}
        onGridReady={onGridReady}
      >
        <HeaderButtons
          route={route}
          names={names}
          toggleColumnsPanel={toggleColumnsPanel}
          onCreateEntity={onCreateEntity}
          gridApi={gridApi}
        />
      </ListView>
    </>
  );
};

export default EvaluationListView;

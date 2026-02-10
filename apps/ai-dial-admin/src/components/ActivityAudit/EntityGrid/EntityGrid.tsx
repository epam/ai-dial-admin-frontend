import { FC, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { CellClickedEvent, ColDef, GridApi, GridReadyEvent, RowClassRules } from 'ag-grid-community';
import { DialNoDataContent } from '@epam/ai-dial-ui-kit';

import ActivityDetails from '@/src/components/ActivityAudit/Modals/Details';
import { getCurrentAndRollbackEntities, getColumnsByParameter } from '@/src/components/ActivityAudit/EntityGrid/utils';
import AgGridWrapper from '@/src/components/Grid/AgGridWrapper';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ActivityAuditDiff, DialActivity } from '@/src/models/activity-audit';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ActivityAuditEntity, ActivityAuditResourceType, DiffStatus, DiffView } from '@/src/types/activity-audit';

interface Props {
  data?: ActivityAuditDiff[];
  parameter?: string;
  index?: number;
  type?: ActivityAuditResourceType;
  columns?: ColDef[];
  diffView?: DiffView;
  rollbackRows?: EntitiesGridData[];
  currentRows?: EntitiesGridData[];
  activity?: DialActivity;
}

const AuditEntityGrid: FC<Props> = ({
  data,
  parameter,
  index,
  type,
  columns,
  diffView,
  rollbackRows,
  currentRows,
  activity,
}) => {
  const t = useI18n();
  const [gridApi, setGridApi] = useState<GridApi>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resourceId, setResourceId] = useState('');
  const [currentState, setCurrentState] = useState<ActivityAuditEntity | undefined>(void 0);
  const [rollbackState, setRollbackState] = useState<ActivityAuditEntity | undefined>(void 0);

  const columnDefs = (columns || getColumnsByParameter(parameter, index, t, type)).map((c) => ({
    ...c,
    sort: void 0,
  }));

  const rowClassRules: RowClassRules = {
    'ag-error-row ag-error-border': (params) => {
      return (params.data as ActivityAuditDiff).diffStatus === DiffStatus.REMOVED;
    },
    'ag-new-row ag-new-border': (params) => {
      return (params.data as ActivityAuditDiff).diffStatus === DiffStatus.ADDED;
    },
    'ag-changed-row ag-changed-border': (params) => {
      return (params.data as ActivityAuditDiff).diffStatus === DiffStatus.CHANGED;
    },
    'ag-empty-row': (params) => {
      return (params.data as ActivityAuditDiff).diffStatus === DiffStatus.MIRROR;
    },
  };

  const onRowClicked = (e: CellClickedEvent) => {
    if (!e.data.diffStatus || e.data.diffStatus === DiffStatus.MIRROR) return;
    const id = e.data.name || e.data.key || e.data.$id;
    setResourceId(id);
    const { current, rollback } = getCurrentAndRollbackEntities(e.data, id, rollbackRows, currentRows);
    setCurrentState(current);
    setRollbackState(rollback);
    setIsModalOpen(true);
  };

  const onGridReady = (event: GridReadyEvent) => {
    setGridApi(event.api);

    event.api?.updateGridOptions({
      columnDefs,
      rowData: data,
      rowClassRules,
    });
  };

  useEffect(() => {
    gridApi?.updateGridOptions({
      rowData: data,
      columnDefs,
    });
  }, [columns, gridApi, columnDefs, diffView, data]);

  return !data?.length ? (
    <div className="rounded border border-secondary h-full">
      <DialNoDataContent title={t(EntitiesI18nKey.NoResource)} />
    </div>
  ) : (
    <div className="w-full h-full relative">
      <AgGridWrapper
        additionalGridOptions={{
          domLayout: 'autoHeight',
          onGridReady,
          onCellClicked: activity && onRowClicked,
        }}
      />
      {isModalOpen &&
        createPortal(
          <ActivityDetails
            auditViewId={void 0}
            isModalOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            partialActivity={{ ...activity, resourceId } as DialActivity}
            currentState={currentState}
            rollBackState={rollbackState}
          />,
          document.body,
        )}
    </div>
  );
};

export default AuditEntityGrid;

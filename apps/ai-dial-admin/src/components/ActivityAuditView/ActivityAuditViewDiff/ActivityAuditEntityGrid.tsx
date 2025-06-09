import { FC, useEffect, useState } from 'react';

import { GridApi, GridReadyEvent, RowClassRules } from 'ag-grid-community';

import { getColumnsByParameter, getRowDataByParameter } from '@/src/components/ActivityAuditView/activity-audit.utils';
import NoDataContent from '@/src/components/Common/NoData/NoData';
import Grid from '@/src/components/Grid/Grid';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ActivityAuditDiff } from '@/src/models/dial/activity-audit';
import { ActivityAuditResourceType, DiffStatus } from '@/src/types/activity-audit';

interface Props {
  data: ActivityAuditDiff[];
  parameter: string;
  index: number;
  type?: ActivityAuditResourceType;
}

const ActivityAuditEntityGrid: FC<Props> = ({ data, parameter, index, type }) => {
  const t = useI18n() as (stringToTranslate: string) => string;
  const [gridApi, setGridApi] = useState<GridApi>();
  const columnDefs = getColumnsByParameter(parameter, index, t, type);
  const rowData = getRowDataByParameter(data, parameter, index, type);

  const rowClassRules: RowClassRules = {
    'ag-error-row ag-error-border': (params) => {
      return (params.data as ActivityAuditDiff).status === DiffStatus.REMOVED;
    },
    'ag-new-row ag-new-border': (params) => {
      return (params.data as ActivityAuditDiff).status === DiffStatus.ADDED;
    },
    'ag-changed-row ag-changed-border': (params) => {
      return (params.data as ActivityAuditDiff).status === DiffStatus.CHANGED;
    },
  };

  const onGridReady = (event: GridReadyEvent) => {
    setGridApi(event.api);

    event.api?.updateGridOptions({
      columnDefs,
      rowData,
      rowClassRules,
    });
  };

  useEffect(() => {
    gridApi?.updateGridOptions({
      rowData,
    });
  }, [rowData, gridApi]);

  return !data?.length ? (
    <div className="rounded border border-secondary h-full">
      <NoDataContent emptyDataTitle={t(EntitiesI18nKey.NoResource)} />
    </div>
  ) : (
    <div className="w-full h-full relative">
      <Grid
        additionalGridOptions={{
          domLayout: 'autoHeight',
          onGridReady,
        }}
      />
    </div>
  );
};

export default ActivityAuditEntityGrid;

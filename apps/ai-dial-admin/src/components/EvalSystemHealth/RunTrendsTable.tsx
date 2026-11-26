'use client';

import { FC, useMemo } from 'react';

import { GridOptions } from 'ag-grid-community';

import { RunTrendRow } from '@/src/components/EvalSystemHealth/models';
import { buildRunTrendColumns } from '@/src/components/EvalSystemHealth/utils/build-run-trend-columns';
import { TWO_LINE_ROW_HEIGHT } from '@/src/components/Grid/constants';
import GridView from '@/src/components/Grid/GridView/GridView';
import { useI18n } from '@/src/locales/client';

interface Props {
  rows: RunTrendRow[];
}

const GRID_OPTIONS: GridOptions<RunTrendRow> = {
  domLayout: 'autoHeight',
  rowHeight: TWO_LINE_ROW_HEIGHT,
  suppressCellFocus: true,
};

const RunTrendsTable: FC<Props> = ({ rows }) => {
  const t = useI18n();
  const columnDefs = useMemo(() => buildRunTrendColumns(t), [t]);

  return <GridView rowData={rows} columnDefs={columnDefs} additionalGridOptions={GRID_OPTIONS} />;
};

export default RunTrendsTable;

'use client';

import { FC, useMemo } from 'react';

import { ColDef, GetRowIdParams, ITooltipParams, ValueFormatterParams, ValueGetterParams } from 'ag-grid-community';

import GridView from '@/src/components/Grid/GridView/GridView';
import ResultValueCell from '@/src/components/Analytics/QueryBuilder/Result/ResultValueCell';
import { isFullValueNeeded, renderCell } from '@/src/components/Analytics/QueryBuilder/utils/result';
import PreviewColumnHeader from '@/src/components/Analytics/Pipelines/Preview/PreviewColumnHeader';
import {
  PREVIEW_GRID_MAX_HEIGHT_PX,
  PREVIEW_HEADER_HEIGHT_PX,
  PREVIEW_ROW_HEIGHT_PX,
} from '@/src/components/Analytics/Pipelines/Preview/constants';
import { PreviewGridRow } from '@/src/components/Analytics/Pipelines/Preview/models';
import { PipelinePreviewI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PreviewColumn, PreviewRow } from '@/src/models/analytics/pipeline-preview';

interface Props {
  columns: PreviewColumn[];
  rows: PreviewRow[];
}

const GRID_BORDER_PX = 2;

const GRID_OPTIONS = {
  headerHeight: PREVIEW_HEADER_HEIGHT_PX,
  rowHeight: PREVIEW_ROW_HEIGHT_PX,
  suppressNoRowsOverlay: true,
};

const getRowId = ({ data }: GetRowIdParams<PreviewGridRow>): string => String(data.index);

/**
 * The sampled rows, one column per entry the service returned, in its order. A column is addressed by its literal
 * name — an enrichment's column is `table.column`, which `field` alone would read as a nested path.
 */
const PreviewGrid: FC<Props> = ({ columns, rows }) => {
  const t = useI18n();

  const gridRows = useMemo(() => rows.map((values, index): PreviewGridRow => ({ index, values })), [rows]);

  const columnDefs = useMemo<ColDef[]>(
    () =>
      columns.map((column) => ({
        colId: column.name,
        headerName: column.name,
        headerComponent: PreviewColumnHeader,
        headerComponentParams: { previewColumn: column },
        valueGetter: ({ data }: ValueGetterParams<PreviewGridRow>) => data?.values[column.name],
        valueFormatter: ({ value }: ValueFormatterParams) =>
          value == null ? t(PipelinePreviewI18nKey.CellNull) : renderCell(value),
        tooltipValueGetter: ({ value, valueFormatted }: ITooltipParams) => {
          const text = valueFormatted ?? renderCell(value);
          return isFullValueNeeded(text) ? undefined : text;
        },
        cellRenderer: ResultValueCell,
        // A sample of a few rows, shown in the order the service chose: sorting would reorder what "newest first" says,
        // and a filter row would take header height from the rows the tab is there to show.
        sortable: false,
        filter: false,
        floatingFilter: false,
      })),
    [columns, t],
  );

  const height = Math.min(
    PREVIEW_HEADER_HEIGHT_PX + rows.length * PREVIEW_ROW_HEIGHT_PX + GRID_BORDER_PX,
    PREVIEW_GRID_MAX_HEIGHT_PX,
  );

  return (
    <div style={{ height }} className="min-h-0 w-full">
      <GridView
        columnDefs={columnDefs}
        rowData={gridRows}
        getRowId={getRowId}
        isLiveData
        additionalGridOptions={GRID_OPTIONS}
      />
    </div>
  );
};

export default PreviewGrid;

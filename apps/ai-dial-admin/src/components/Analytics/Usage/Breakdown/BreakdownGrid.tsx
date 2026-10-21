'use client';

import { FC, useCallback, useMemo, useRef } from 'react';

import { ColDef, IDatasource, ModelUpdatedEvent } from 'ag-grid-community';
import { DialLoader } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import { MeasureCellParams } from '@/src/components/Analytics/Usage/Breakdown/cells/MeasureCell';
import UsageEmptyState from '@/src/components/Analytics/Usage/Empty/UsageEmptyState';
import { BreakdownRowModel, WidestFigures } from '@/src/components/Analytics/Usage/models';
import { getFigureRulerVar, pickWidestFigures } from '@/src/components/Analytics/Usage/utils/figure-width';
import GridView from '@/src/components/Grid/GridView/GridView';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { QUERY_ROW_LIMIT } from '@/src/components/Analytics/Usage/constants';
import { infiniteGridOptions } from '@/src/constants/ag-grid';

interface Props {
  /** The rows to show when the caller already holds them; ignored once `datasource` is given. */
  rows: BreakdownRowModel[];
  columnDefs: ColDef<BreakdownRowModel>[];
  isLoading: boolean;
  hasFailed: boolean;
  className?: string;
  /** Reads rows block by block instead, which hands paging, ordering and filtering to the grid. */
  datasource?: IDatasource;
  /** A new value remounts the grid, which is what drops blocks loaded for a previous window. */
  datasourceKey?: string;
  blockSize?: number;
  isLoadingBlock?: boolean;
  /** Sizes the grid to its rows instead of to `className`'s height. */
  isAutoHeight?: boolean;
}

const HEADER_OFFSET_CLASS = 'top-[42px]';
const LOADER_SIZE = 24;
const BREAKDOWN_ROW_HEIGHT = 40;

const BreakdownGrid: FC<Props> = ({
  rows,
  columnDefs,
  isLoading,
  hasFailed,
  className,
  datasource,
  datasourceKey,
  blockSize,
  isLoadingBlock,
  isAutoHeight,
}) => {
  const t = useI18n();
  const gridRef = useRef<HTMLDivElement>(null);

  const figureFormats = useMemo(() => {
    const formats: Record<string, MeasureCellParams['format']> = {};

    for (const { colId, cellRendererParams } of columnDefs) {
      if (colId && cellRendererParams?.format) {
        formats[colId] = cellRendererParams.format;
      }
    }

    return formats;
  }, [columnDefs]);

  const widestRef = useRef<WidestFigures>({ widest: {} });

  const onModelUpdated = useCallback(
    (event: ModelUpdatedEvent<BreakdownRowModel>) => {
      const grid = gridRef.current;

      if (!grid) {
        return;
      }

      const previous = widestRef.current;
      const isSameList = Boolean(datasource) && previous.formats === figureFormats && previous.key === datasourceKey;
      const loadedRows: BreakdownRowModel[] = [];

      event.api.forEachNode((node) => {
        if (node.data) {
          loadedRows.push(node.data);
        }
      });

      const widest = pickWidestFigures(loadedRows, figureFormats, isSameList ? previous.widest : {});

      for (const colId of Object.keys(previous.widest)) {
        if (!(colId in widest)) {
          grid.style.removeProperty(getFigureRulerVar(colId));
        }
      }

      for (const [colId, text] of Object.entries(widest)) {
        grid.style.setProperty(getFigureRulerVar(colId), JSON.stringify(text));
      }

      widestRef.current = { formats: figureFormats, key: datasourceKey, widest };
    },
    [datasource, datasourceKey, figureFormats],
  );

  const sharedOptions = { rowHeight: BREAKDOWN_ROW_HEIGHT, onModelUpdated };

  if (isLoading) {
    return (
      <div className={classNames('flex items-center justify-center', className)}>
        <DialLoader size={24} />
      </div>
    );
  }

  const isEmpty = !datasource && (hasFailed || rows.length === 0);

  return (
    <div ref={gridRef} className={classNames('relative', className)}>
      <GridView<BreakdownRowModel>
        key={datasourceKey}
        rowData={datasource ? void 0 : rows}
        columnDefs={columnDefs}
        getRowId={(params) => params.data.id}
        additionalGridOptions={
          datasource
            ? {
                ...infiniteGridOptions,
                ...sharedOptions,
                cacheBlockSize: blockSize,
                maxBlocksInCache: blockSize ? Math.floor(QUERY_ROW_LIMIT / blockSize) : void 0,
                suppressMultiSort: true,
                datasource,
              }
            : {
                ...sharedOptions,
                suppressNoRowsOverlay: true,
                ...(isAutoHeight ? { domLayout: 'autoHeight' as const } : {}),
              }
        }
        getIsEmptyData={() => false}
      />
      {isLoadingBlock && (
        <div
          className={classNames(
            'pointer-events-none absolute inset-x-0 bottom-0 flex items-start justify-center pt-6',
            HEADER_OFFSET_CLASS,
          )}
        >
          <DialLoader size={LOADER_SIZE} />
        </div>
      )}
      {isEmpty && (
        <div
          className={classNames('absolute inset-x-0 bottom-0 flex items-center justify-center', HEADER_OFFSET_CLASS)}
        >
          <UsageEmptyState
            title={t(AnalyticsUsageI18nKey.BreakdownEmptyTitle)}
            lines={[t(AnalyticsUsageI18nKey.BreakdownEmptyBody)]}
          />
        </div>
      )}
    </div>
  );
};

export default BreakdownGrid;

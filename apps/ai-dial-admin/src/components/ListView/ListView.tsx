'use client';
import { ReactNode } from 'react';

import { ColDef, GridOptions, GridReadyEvent } from 'ag-grid-community';
import classNames from 'classnames';

import GridView from '@/src/components/Grid/GridView/GridView';
import { ApplicationRoute } from '@/src/types/routes';

interface Props<T> {
  emptyDataTitle: string;
  title?: string;
  emptyDataDescription?: string;
  children?: ReactNode;
  data?: T[];
  columnDefs: ColDef[];
  additionalGridOptions?: GridOptions;
  showColumnsPanel?: boolean;
  view?: ApplicationRoute;
  storageKey?: string;
  toggleColumnsPanel?: () => void;
  onGridReady?: (gridApi: GridReadyEvent) => void;
  allowPadding?: boolean;
  getHref?: (data: unknown) => string | undefined;
}

const ListView = <T extends object>({
  emptyDataTitle,
  emptyDataDescription,
  title,
  data,
  columnDefs,
  children,
  additionalGridOptions,
  showColumnsPanel,
  view,
  storageKey,
  toggleColumnsPanel,
  onGridReady,
  allowPadding = true,
  getHref,
}: Props<T>) => {
  return (
    <div className={classNames('flex flex-col bg-layer-2 rounded flex-1 min-h-0', allowPadding && 'py-4 px-6')}>
      <div className="flex flex-row flex-wrap justify-between mb-4 items-center">
        {title && <h1>{title}</h1>}
        {children}
      </div>
      <div className="flex flex-1 min-h-0 gap-4">
        <GridView
          columnDefs={columnDefs}
          rowData={data}
          additionalGridOptions={{ ...additionalGridOptions }}
          emptyDataProps={{ title: emptyDataTitle, description: emptyDataDescription }}
          showColumnsPanel={showColumnsPanel}
          toggleColumnsPanel={toggleColumnsPanel}
          storageKey={storageKey || view}
          onGridReady={onGridReady}
          getHref={getHref}
        />
      </div>
    </div>
  );
};

export default ListView;

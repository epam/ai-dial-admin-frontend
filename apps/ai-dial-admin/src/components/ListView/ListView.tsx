import { ReactNode } from 'react';

import { ColDef, GridApi, GridOptions } from 'ag-grid-community';

import FolderList from '@/src/components/Common/FolderList/FolderList';
import GridWithColumnsPanel from '@/src/components/Grid/GridWithColumnsPanel/GridWithColumnsPanel';
import { FileFolderContextType } from '@/src/context/FileFolderContext';
import { PromptFolderContextType } from '@/src/context/PromptFolderContext';
import { ApplicationRoute } from '@/src/types/routes';

interface Props<T> {
  emptyDataTitle: string;
  title: string;
  children?: ReactNode;
  data?: T[];
  columnDefs: ColDef[];
  additionalGridOptions?: GridOptions;
  showColumnsPanel?: boolean;
  showFolders?: boolean;
  view?: ApplicationRoute;
  toggleColumnsPanel?: () => void;
  context?: () => PromptFolderContextType | FileFolderContextType;
  dataTestId?: string;
  onGridReady?: (gridApi: GridApi) => void;
}

const ListView = <T extends object>({
  emptyDataTitle,
  title,
  data,
  columnDefs,
  children,
  additionalGridOptions,
  showColumnsPanel,
  showFolders,
  view,
  toggleColumnsPanel,
  context,
  dataTestId,
  onGridReady,
}: Props<T>) => {
  return (
    <div className="flex flex-col bg-layer-2 rounded p-4 flex-1 min-h-0" data-testid={dataTestId}>
      <div className="flex flex-row justify-between mb-3">
        <h1>{title}</h1>
        {children}
      </div>
      <div className="flex flex-1 min-h-0 gap-4">
        {showFolders && (
          <div className="w-[320px] bg-layer-3 rounded p-4 flex-shrink-0 flex">
            <FolderList context={context} view={view} />
          </div>
        )}
        <GridWithColumnsPanel
          columnDefs={columnDefs}
          data={data}
          additionalGridOptions={{
            ...additionalGridOptions,
          }}
          emptyDataTitle={emptyDataTitle}
          showColumnsPanel={showColumnsPanel}
          toggleColumnsPanel={toggleColumnsPanel}
          view={view}
          onGridReady={onGridReady}
        />
      </div>
    </div>
  );
};

export default ListView;

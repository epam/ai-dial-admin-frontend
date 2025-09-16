import { ReactNode } from 'react';

import { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import classNames from 'classnames';

import FolderList from '@/src/components/Common/FolderList/FolderList';
import GridWithColumnsPanel from '@/src/components/Grid/GridWithColumnsPanel/GridWithColumnsPanel';
import { FileFolderContextType } from '@/src/context/FileFolderContext';
import { PromptFolderContextType } from '@/src/context/PromptFolderContext';
import { ApplicationRoute } from '@/src/types/routes';

interface Props<T> {
  emptyDataTitle: string;
  title?: string;
  children?: ReactNode;
  data?: T[];
  columnDefs: ColDef[];
  additionalGridOptions?: GridOptions;
  showColumnsPanel?: boolean;
  showFolders?: boolean;
  view?: ApplicationRoute;
  storageKey?: string;
  toggleColumnsPanel?: () => void;
  context?: () => PromptFolderContextType | FileFolderContextType;
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
  storageKey,
  toggleColumnsPanel,
  context,
  onGridReady,
}: Props<T>) => {
  return (
    <div className={classNames('flex flex-col bg-layer-2 rounded flex-1 min-h-0', title ? 'p-4' : '')}>
      <div className="flex flex-row justify-between mb-3">
        {title && <h1>{title}</h1>}
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
          storageKey={storageKey || view}
          onGridReady={onGridReady}
        />
      </div>
    </div>
  );
};

export default ListView;

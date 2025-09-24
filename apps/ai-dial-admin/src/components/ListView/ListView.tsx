'use client';
import { ReactNode } from 'react';

import { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import classNames from 'classnames';

import FolderCollapse from '@/public/images/icons/folder-collapse.svg';
import ExportGrid from '@/src/components/Assets/ExportAssets/ExportGrid';
import FolderList from '@/src/components/Common/FolderList/FolderList';
import HorizontalCollapseBar from '@/src/components/Common/HorizontalCollapseBar/HorizontalCollapseBar';
import Tooltip from '@/src/components/Common/Tooltip/Tooltip';
import GridWithColumnsPanel from '@/src/components/Grid/GridWithColumnsPanel/GridWithColumnsPanel';
import { ROOT_FOLDER } from '@/src/constants/file';
import { FoldersI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContext } from '@/src/context/AssetsFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import { ApplicationRoute } from '@/src/types/routes';
import { DialButton } from '@epam/ai-dial-ui-kit';

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
  context?: () => AssetsFolderContext<DialFile>;
  onGridReady?: (gridApi: GridApi) => void;
  isBulkView?: boolean;
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
  isBulkView,
}: Props<T>) => {
  const t = useI18n();
  const folderContext = context?.();
  const isCollapseDisable =
    folderContext?.expandedFolders.size === 0 ||
    (folderContext?.expandedFolders.size === 1 && folderContext?.expandedFolders.has(`${ROOT_FOLDER}/`));

  const collapseFolders = () => {
    folderContext?.toggleFolder({ path: `${ROOT_FOLDER}/` } as DialFile, true, true);
  };

  return (
    <div className={classNames('flex flex-col bg-layer-2 rounded flex-1 min-h-0', title ? 'p-4' : '')}>
      <div className="flex flex-row justify-between mb-3">
        {title && <h1>{title}</h1>}
        {children}
      </div>
      <div className="flex flex-1 min-h-0 gap-4">
        {showFolders && (
          <HorizontalCollapseBar
            width="320"
            title={title || ''}
            containerClass="bg-layer-3 border-transparent mr-0"
            iconSize={24}
            additionalButtons={
              <Tooltip
                triggerClassName={'flex items-center'}
                tooltip={isCollapseDisable ? '' : t(FoldersI18nKey.CollapseAll)}
                placement={'top'}
              >
                <DialButton
                  cssClass={isCollapseDisable ? 'text-controls-disable' : 'hover:text-icon-accent-primary'}
                  onClick={collapseFolders}
                  iconBefore={<FolderCollapse width={24} height={24} />}
                  disable={isCollapseDisable}
                />
              </Tooltip>
            }
          >
            <FolderList context={context} view={view} />
          </HorizontalCollapseBar>
        )}
        {isBulkView ? (
          <ExportGrid context={context} route={view} />
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default ListView;

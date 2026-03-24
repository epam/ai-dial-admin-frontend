'use client';
import { ReactNode } from 'react';

import { DialCollapsibleSidebar, DialIconButton, DialTooltip } from '@epam/ai-dial-ui-kit';

import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { ColDef, GridOptions, GridReadyEvent } from 'ag-grid-community';
import classNames from 'classnames';

import FolderCollapse from '@/public/images/icons/folder-collapse.svg';
import ExportGrid from '@/src/components/Assets/ExportAssets/ExportGrid';
import FolderList from '@/src/components/Common/FolderList/FolderList';
import GridView from '@/src/components/Grid/GridView/GridView';
import { ROOT_FOLDER } from '@/src/constants/file';
import { FoldersI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useI18n } from '@/src/locales/client';
import { Asset } from '@/src/models/dial/deployment-asset';
import { ApplicationRoute } from '@/src/types/routes';
import { isAssetView } from '@/src/utils/is-view';

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
  context?: () => AssetsFolderContext;
  onGridReady?: (gridApi: GridReadyEvent) => void;
  isBulkView?: boolean;
  allowPadding?: boolean;
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
  context,
  onGridReady,
  isBulkView,
  allowPadding = true,
}: Props<T>) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const folderContext = context?.();
  const isCollapseDisable =
    folderContext?.expandedFolders.size === 0 ||
    (folderContext?.expandedFolders.size === 1 && folderContext?.expandedFolders.has(`${ROOT_FOLDER}/`));

  const collapseFolders = () => {
    folderContext?.toggleFolder({ path: `${ROOT_FOLDER}/` } as Asset, true, true);
  };

  return (
    <div className={classNames('flex flex-col bg-layer-2 rounded flex-1 min-h-0', allowPadding && 'py-4 px-6')}>
      <div className="flex flex-row flex-wrap justify-between mb-4 items-center h-[40px]">
        {title && <h1>{title}</h1>}
        {children}
      </div>
      <div className="flex flex-1 min-h-0 gap-4">
        {isAssetView(view) && (
          <DialCollapsibleSidebar
            width={320}
            title={title || ''}
            containerClassName="bg-layer-3 border-transparent mr-0"
            iconSize={24}
            additionalButtons={
              <DialTooltip
                triggerClassName="flex items-center"
                tooltip={isCollapseDisable ? '' : t(FoldersI18nKey.CollapseAll)}
                placement="top"
              >
                <DialIconButton
                  className={classNames(
                    isCollapseDisable ? 'text-controls-disable' : 'hover:text-accent-primary',
                    'size-auto',
                  )}
                  onClick={collapseFolders}
                  icon={<FolderCollapse width={24} height={24} />}
                  disabled={isCollapseDisable}
                />
              </DialTooltip>
            }
          >
            <FolderList context={context} view={view} disabled={isReadOnlyAdmin} />
          </DialCollapsibleSidebar>
        )}
        {isBulkView ? (
          <ExportGrid context={context} route={view} />
        ) : (
          <GridView
            columnDefs={columnDefs}
            rowData={data}
            additionalGridOptions={{ ...additionalGridOptions }}
            emptyDataProps={{ title: emptyDataTitle, description: emptyDataDescription }}
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

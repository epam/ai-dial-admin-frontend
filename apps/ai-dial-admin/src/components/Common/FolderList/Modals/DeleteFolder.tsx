import { FC, useEffect, useMemo, useState } from 'react';

import { DialCollapsibleSidebar, DialFormPopup, DialNoDataContent, PopupSize } from '@epam/ai-dial-ui-kit';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';

import FolderList from '@/src/components/Common/FolderList/FolderList';
import { generatePromptRowDataForDelete } from '@/src/components/Common/FolderList/utils';
import TagsCellRenderer from '@/src/components/Grid/CellRenderers/TagsCellRenderer';
import Grid from '@/src/components/Grid/Grid';
import { listViewTitleMap } from '@/src/components/ListView/constants';
import { BasicI18nKey, ButtonsI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  isModalOpen: boolean;
  view?: ApplicationRoute;
  selectedFolder?: string;
  isBulkDelete?: boolean;
  context?: () => AssetsFolderContext;
  onClose: () => void;
  onApply?: () => void;
}

const DeleteFolder: FC<Props> = ({ isModalOpen, view, selectedFolder, isBulkDelete, context, onClose, onApply }) => {
  const t = useI18n();

  const folderContext = context?.();
  const filePath = folderContext?.filePath as string;

  const [gridApi, setGridApi] = useState<GridApi>();
  const [rowData, setRowData] = useState<DialFile[]>([]);

  const columnDefs: ColDef[] = useMemo(() => {
    const columns: ColDef[] = [{ field: 'name', colId: 'name', headerName: 'Display name', hide: false }];
    if (view !== ApplicationRoute.Files) {
      columns.push({
        headerName: 'Version',
        field: 'version',
        filter: true,
        cellRenderer: TagsCellRenderer,
        cellRendererParams: (params: { data?: { versions?: string[] } }) => ({
          items: params.data?.versions || [],
        }),
      });
    }
    return columns;
  }, [view]);

  const asset = useMemo(() => {
    return String([listViewTitleMap[view || '']]);
  }, [view]);

  const onGridReady = (event: GridReadyEvent) => {
    setGridApi(event.api);

    event.api?.updateGridOptions({
      columnDefs,
      rowData,
    });
  };

  useEffect(() => {
    gridApi?.updateGridOptions({
      rowData,
      columnDefs,
    });
  }, [gridApi, columnDefs, rowData]);

  useEffect(() => {
    setRowData(
      generatePromptRowDataForDelete(
        isBulkDelete
          ? (folderContext?.bulkSelectedData[filePath] as DialPrompt[])
          : (folderContext?.fetchedFoldersData[filePath] as DialPrompt[]),
      ),
    );
  }, [filePath, folderContext, folderContext?.fetchedFoldersData, isBulkDelete]);

  return (
    <DialFormPopup
      onClose={onClose}
      header={t(FoldersI18nKey.DeleteFolder)}
      portalId="DeleteFolder"
      open={isModalOpen}
      size={PopupSize.Lg}
      className="h-[750px]"
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      submitLabel={t(ButtonsI18nKey.Delete)}
      onSubmit={() => {
        onApply?.();
        onClose();
      }}
      onCancel={onClose}
    >
      <div className="flex flex-col gap-4 px-6 py-4 h-full">
        <div className="text-secondary text-sm">
          {t(FoldersI18nKey.DeleteFolderDescription, { asset: t(asset).toLowerCase() })}
        </div>
        <div className="flex flex-row gap-4 flex-1 min-h-0">
          <DialCollapsibleSidebar
            width={360}
            title={t(FoldersI18nKey.Folders)}
            containerClassName="border border-primary"
          >
            <FolderList
              context={context}
              isFolderDelete={true}
              initialPath={selectedFolder}
              isBulkDelete={isBulkDelete}
            />
          </DialCollapsibleSidebar>
          <div className="flex-1 min-h-0">
            {rowData.length ? (
              <Grid
                additionalGridOptions={{
                  onGridReady,
                }}
              />
            ) : (
              <DialNoDataContent title={t(BasicI18nKey.NoData)} />
            )}
          </div>
        </div>
      </div>
    </DialFormPopup>
  );
};

export default DeleteFolder;

import { FC, useEffect, useMemo, useState } from 'react';

import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import classNames from 'classnames';
import { ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';
import { DialNoDataContent } from '@epam/ai-dial-ui-kit';

import FolderList from '@/src/components/Common/FolderList/FolderList';
import { generatePromptRowDataForDelete } from '@/src/components/Common/FolderList/utils';
import HorizontalCollapseBar from '@/src/components/Common/HorizontalCollapseBar/HorizontalCollapseBar';
import Popup from '@/src/components/Common/Popup/Popup';
import { listViewTitleMap } from '@/src/components/EntityListView/constants';
import TopicsCellRenderer from '@/src/components/Grid/CellRenderers/TopicCellRenderer';
import Grid from '@/src/components/Grid/Grid';
import { BasicI18nKey, ButtonsI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  modalState: PopUpState;
  view?: ApplicationRoute;
  selectedFolder?: string;
  isBulkDelete?: boolean;
  context?: () => AssetsFolderContext<DialFile>;
  onClose: () => void;
  onApply?: () => void;
}

const DeleteFolder: FC<Props> = ({ modalState, view, selectedFolder, isBulkDelete, context, onClose, onApply }) => {
  const t = useI18n() as (s: string, params?: Record<string, string>) => string;
  const containerClassName = classNames('h-[750px] lg:max-w-[65%]');

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
        cellRenderer: TopicsCellRenderer,
        cellRendererParams: (params: { data?: { versions?: string[] } }) => ({
          topics: params.data?.versions || [],
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
    <Popup
      onClose={onClose}
      heading={t(FoldersI18nKey.DeleteFolder)}
      portalId="DeleteFolder"
      state={modalState}
      containerClassName={containerClassName}
    >
      <div className="flex flex-col gap-4 px-6 py-4 flex-1 min-h-0">
        <div className="text-secondary text-sm">
          {t(FoldersI18nKey.DeleteFolderDescription, { asset: t(asset).toLowerCase() })}
        </div>
        <div className="flex flex-row gap-4 flex-1 min-h-0">
          <HorizontalCollapseBar width="360" title={t(FoldersI18nKey.Folders)} containerClass="border-primary">
            <FolderList
              context={context}
              isFolderDelete={true}
              initialPath={selectedFolder}
              isBulkDelete={isBulkDelete}
            />
          </HorizontalCollapseBar>
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
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <DialButton variant={ButtonVariant.Secondary} title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <DialButton
          variant={ButtonVariant.Primary}
          title={t(ButtonsI18nKey.Delete)}
          onClick={() => {
            onApply?.();
            onClose();
          }}
          disable={false}
        />
      </div>
    </Popup>
  );
};

export default DeleteFolder;

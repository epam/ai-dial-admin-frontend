import { FC, useEffect, useRef, useState } from 'react';

import { GridApi, GridReadyEvent } from 'ag-grid-community';

import NoData from '@/src/components/Common/NoData/NoData';
import { EXPORT_COLUMNS } from '@/src/components/EntityListView/entity-list-view';
import { getGridFileData } from '@/src/components/FilesList/files-list';
import Grid from '@/src/components/Grid/Grid';
import { CHECKBOX_COL_DEF } from '@/src/constants/ag-grid';
import { ALL_ID } from '@/src/constants/dial-base-entity';
import { BasicI18nKey } from '@/src/constants/i18n';
import { STRINGS_DELIMITER } from '@/src/constants/prompt';
import { FileFolderContextType } from '@/src/context/FileFolderContext';
import { PromptFolderContextType } from '@/src/context/PromptFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ApplicationRoute } from '@/src/types/routes';
import { changeExportFileData, changeExportPromptData, generatePromptRowDataForExportGrid } from './export';

interface Props {
  route?: ApplicationRoute;
  context?: () => PromptFolderContextType | FileFolderContextType;
}

const ExportGrid: FC<Props> = ({ route, context }) => {
  const t = useI18n();
  const folderContext = context?.();

  const [rowData, setRowData] = useState<DialFile[]>([]);
  const [gridApi, setGridApi] = useState<GridApi>();
  const [isSkipRefresh, setIsSkipRefresh] = useState<boolean>(false);
  const fetchedRef = useRef(folderContext?.fetchedFoldersData as Record<string, (DialFile | DialPrompt)[]>);
  const exportRef = useRef(folderContext?.exportFoldersData as Record<string, (DialFile | DialPrompt)[]>);
  const filePath = folderContext?.filePath as string;

  useEffect(() => {
    fetchedRef.current = folderContext?.fetchedFoldersData as Record<string, (DialFile | DialPrompt)[]>;
    exportRef.current = folderContext?.exportFoldersData as Record<string, (DialFile | DialPrompt)[]>;
  }, [folderContext?.fetchedFoldersData, folderContext?.exportFoldersData]);

  const onChangeVersions = (value: string, name: string) => {
    setIsSkipRefresh(true);
    const newData = [...rowData];
    const prompt = newData.find((prompt) => prompt.name === name) as DialPrompt;
    // handle SelectAll click
    if (value === ALL_ID) {
      prompt.version = prompt.versions?.join(STRINGS_DELIMITER) as string;
      setRowData(newData);
      const exportedIndex = exportRef.current[filePath]?.findIndex((prompt) => prompt.name === name);
      if (exportedIndex != null && exportedIndex > -1) {
        const fetched = fetchedRef.current[filePath].filter((prompt) => prompt.name === name);
        folderContext?.setExportFoldersData({
          ...exportRef.current,
          [filePath]: fetched,
        } as Record<string, DialPrompt[]>);
      }
    } else {
      // handle add/remove version when row not selected
      const versions = prompt?.version.split(STRINGS_DELIMITER);
      const newVersions = versions?.filter((v) => v !== value);
      if (versions?.length === newVersions?.length) {
        newVersions?.push(value);
      }
      prompt.version = newVersions?.join(STRINGS_DELIMITER);
      setRowData(newData);
      const exportedIndex = exportRef.current?.[filePath]?.findIndex(
        (prompt) => prompt.name === name && (prompt as DialPrompt).version === value,
      );
      // additionally handle remove for selected row
      if (exportedIndex != null && exportedIndex > -1) {
        const newExportData = exportRef.current?.[filePath];
        newExportData.splice(exportedIndex, 1);
        folderContext?.setExportFoldersData({
          ...exportRef.current,
          [filePath]: newExportData,
        } as Record<string, DialPrompt[]>);
      } else {
        // additionally handle add for selected row
        const exist = exportRef.current[filePath]?.findIndex((prompt) => prompt.name === name);
        const fetched = (fetchedRef.current[filePath] as DialPrompt[]).find(
          (prompt) => prompt.name === name && prompt.version === value,
        ) as DialPrompt;
        if (exist != null && exist > -1 && fetched) {
          const newExportData = exportRef.current[filePath];
          newExportData.push(fetched);
          folderContext?.setExportFoldersData({
            ...exportRef.current,
            [filePath]: newExportData,
          } as Record<string, DialPrompt[]>);
        }
      }
    }
  };
  const columnDefs = EXPORT_COLUMNS(onChangeVersions, route);

  const onGridReady = (event: GridReadyEvent) => {
    setGridApi(event.api);
    event.api?.updateGridOptions({
      columnDefs,
      rowData,
    });
    event.api.forEachNode((node) => {
      if (folderContext?.exportFoldersData[filePath]?.some((file) => file.path === node.data.path)) {
        node.setSelected(true);
      }
    });
  };

  useEffect(() => {
    if (!isSkipRefresh && !gridApi?.isDestroyed()) {
      gridApi?.updateGridOptions({
        rowData,
        columnDefs,
      });
      gridApi?.forEachNode((node) => {
        if (folderContext?.exportFoldersData[filePath]?.some((file) => file.path === node.data.path)) {
          node.setSelected(true);
        }
      });
    }
  }, [gridApi, columnDefs, rowData, filePath, isSkipRefresh, folderContext?.exportFoldersData]);

  useEffect(() => {
    setIsSkipRefresh(false);
  }, [filePath]);

  useEffect(() => {
    setRowData(
      route === ApplicationRoute.Prompts
        ? generatePromptRowDataForExportGrid(
            folderContext?.fetchedFoldersData[filePath] as DialPrompt[],
            folderContext?.exportFoldersData[filePath] as DialPrompt[],
          )
        : getGridFileData((folderContext?.fetchedFoldersData[filePath] as DialFile[]) || []),
    );
  }, [filePath, folderContext?.fetchedFoldersData, folderContext?.exportFoldersData, route]);

  return (
    <div className="flex-1 min-h-0">
      {rowData.length ? (
        <Grid
          additionalGridOptions={{
            rowSelection: {
              mode: 'multiRow',
              headerCheckbox: true,
              selectAll: 'filtered',
            },
            selectionColumnDef: {
              ...CHECKBOX_COL_DEF,
            },
            onSelectionChanged: (event) => {
              setIsSkipRefresh(true);
              const selectedRows = event.api.getSelectedRows();
              folderContext?.setExportFoldersData(
                route === ApplicationRoute.Prompts
                  ? changeExportPromptData(
                      selectedRows as DialPrompt[],
                      folderContext?.fetchedFoldersData as Record<string, DialPrompt[]>,
                      folderContext?.filePath,
                      folderContext?.exportFoldersData as Record<string, DialPrompt[]>,
                    )
                  : (changeExportFileData(
                      selectedRows as DialFile[],
                      folderContext?.fetchedFoldersData as Record<string, DialFile[]>,
                      folderContext?.filePath,
                      folderContext?.exportFoldersData as Record<string, DialFile[]>,
                    ) as Record<string, DialPrompt[]>),
              );
            },
            onGridReady,
          }}
        />
      ) : (
        <NoData emptyDataTitle={t(BasicI18nKey.NoData)} />
      )}
    </div>
  );
};

export default ExportGrid;

import { FC, useEffect, useRef, useState } from 'react';

import { DialNoDataContent } from '@epam/ai-dial-ui-kit';
import { GridApi, GridReadyEvent } from 'ag-grid-community';

import Grid from '@/src/components/Grid/Grid';
import { CHECKBOX_COL_DEF } from '@/src/constants/ag-grid';
import { EXPORT_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { BasicI18nKey } from '@/src/constants/i18n';
import { STRINGS_DELIMITER } from '@/src/constants/prompt';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useI18n } from '@/src/locales/client';
import { Asset } from '@/src/models/dial/deployment-asset';
import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ApplicationRoute } from '@/src/types/routes';
import { changeExportGridData, getExportGridData } from './export';

interface Props {
  route?: ApplicationRoute;
  context?: () => AssetsFolderContext<Asset>;
}

const ExportGrid: FC<Props> = ({ route, context }) => {
  const t = useI18n();
  const folderContext = context?.();

  const [rowData, setRowData] = useState<DialFile[]>([]);
  const [gridApi, setGridApi] = useState<GridApi>();
  const [isSkipRefresh, setIsSkipRefresh] = useState<boolean>(false);
  const fetchedRef = useRef(folderContext?.fetchedFoldersData as Record<string, (DialFile | DialPrompt)[]>);
  const exportRef = useRef(folderContext?.bulkSelectedData as Record<string, (DialFile | DialPrompt)[]>);
  const filePath = folderContext?.filePath as string;

  useEffect(() => {
    fetchedRef.current = folderContext?.fetchedFoldersData as Record<string, (DialFile | DialPrompt)[]>;
    exportRef.current = folderContext?.bulkSelectedData as Record<string, (DialFile | DialPrompt)[]>;
  }, [folderContext?.fetchedFoldersData, folderContext?.bulkSelectedData]);

  const onChangeVersions = (value: string[], data: unknown, _field: string, _index: number, isSelected: boolean) => {
    setIsSkipRefresh(true);

    const name = (data as { name: string }).name;
    const newData = [...rowData];
    const prompt = newData.find((prompt) => prompt.name === name) as DialPrompt;
    prompt.version = value?.join(STRINGS_DELIMITER);
    setRowData(newData);

    const exportedIndex = exportRef.current?.[filePath]?.findIndex((prompt) => prompt.name === name);

    if ((exportedIndex != null && exportedIndex > -1) || isSelected) {
      const newExportData = exportRef.current?.[filePath].filter((prompt) => prompt.name !== name) as DialPrompt[];
      fillExportData(value, name, newExportData);
    }
  };

  const fillExportData = (versions: string[], promptName: string, newExportData: (DialFile | DialPrompt)[]) => {
    versions.forEach((version) => {
      const fetched = (fetchedRef.current[filePath] as DialPrompt[]).find(
        (prompt) => prompt.name === promptName && prompt.version === version,
      ) as DialPrompt;
      newExportData.push(fetched);
    });
    folderContext?.setBulkSelectedData({
      ...exportRef.current,
      [filePath]: newExportData,
    } as Record<string, DialPrompt[]>);
  };

  const columnDefs = EXPORT_COLUMNS(onChangeVersions, route);

  const onGridReady = (event: GridReadyEvent) => {
    setGridApi(event.api);
    event.api?.updateGridOptions({
      columnDefs,
      rowData,
    });
    event.api.forEachNode((node) => {
      if (
        folderContext?.bulkSelectedData[filePath]?.some(
          (file) => file.folderId + file.name === node.data.folderId + node.data.name,
        )
      ) {
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
        if (
          folderContext?.bulkSelectedData[filePath]?.some(
            (file) => file.folderId + file.name === node.data.folderId + node.data.name,
          )
        ) {
          node.setSelected(true);
        }
      });
    }
  }, [gridApi, columnDefs, rowData, filePath, isSkipRefresh, folderContext?.bulkSelectedData]);

  useEffect(() => {
    setIsSkipRefresh(false);
  }, [filePath]);

  useEffect(() => {
    const rowData: (DialPrompt | DialFile)[] = getExportGridData(
      route,
      folderContext?.fetchedFoldersData[filePath] || [],
      folderContext?.bulkSelectedData[filePath] || [],
    );
    setRowData(rowData);
  }, [filePath, folderContext?.fetchedFoldersData, folderContext?.bulkSelectedData, route]);

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
              folderContext?.setBulkSelectedData(
                changeExportGridData(
                  route,
                  folderContext?.fetchedFoldersData,
                  folderContext?.bulkSelectedData,
                  selectedRows,
                  folderContext?.filePath,
                ),
              );
            },
            onGridReady,
          }}
        />
      ) : (
        <DialNoDataContent title={t(BasicI18nKey.NoData)} />
      )}
    </div>
  );
};

export default ExportGrid;

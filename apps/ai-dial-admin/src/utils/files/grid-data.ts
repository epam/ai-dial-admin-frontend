import { ColDef } from 'ag-grid-community';

import FileNameCellRenderer from '@/src/components/Grid/CellRenderers/FileNameCellRenderer';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import { PublicationFile } from '@/src/models/dial/publications';
import { getNameExtensionFromFile } from './get-extension';

export interface FileRowData {
  name: string;
  extension: string;
  path: string;
}

export const getGridFileDataFromString = (files: string[]): FileRowData[] => {
  return files.map((file) => {
    const { name, extension } = getNameExtensionFromFile(file);
    return {
      name,
      extension,
      path: file,
    };
  });
};

export const getGridFileData = (files: PublicationFile[]): FileRowData[] => {
  return files.map((file) => {
    const { name, extension } = getNameExtensionFromFile(file.file.name as string);
    return {
      name,
      extension,
      path: file.file.path as string,
    };
  });
};

export const getGridFileColumns = <T>(columns: ColDef[], actions: ActionMenuOperationDeclaration<T>[]) => {
  const modifiedColDefs = [...columns].slice(0, 2).map((colDef, index) => {
    const column = { ...colDef };
    column.filter = false;
    column.floatingFilter = false;

    if (index === 0) {
      column.cellRenderer = FileNameCellRenderer;
    }

    if (index === 1) {
      column.maxWidth = 168;
    }

    return column;
  });
  return [...modifiedColDefs, ACTION_COLUMN(actions)];
};

import { ColDef } from 'ag-grid-community';

import FileNameCellRenderer from '@/src/components/Grid/CellRenderers/FileNameCellRenderer';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import { DialFile } from '@/src/models/dial/file';
import { PublicationFile } from '@/src/models/dial/publications';
import { getNameExtensionFromFile } from './get-extension';

export interface FileRowData {
  name: string;
  extension: string;
  path: string;
}

export const getPublicationGridFileDataFromString = (files: string[]): FileRowData[] => {
  return files.map((file) => {
    const { name, extension } = getNameExtensionFromFile(file);
    return {
      name,
      extension,
      path: file,
    };
  });
};

export const getPublicationGridFileData = (files: PublicationFile[]): FileRowData[] => {
  return files.map((file) => {
    const { name, extension } = getNameExtensionFromFile(file.file.name as string);
    return {
      name,
      extension,
      path: file.file.path as string,
    };
  });
};

export const getGridFileData = (files: DialFile[]) => {
  return files.map((file) => {
    const { name, extension } = getNameExtensionFromFile(file.name as string);
    return {
      ...file,
      name,
      extension,
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

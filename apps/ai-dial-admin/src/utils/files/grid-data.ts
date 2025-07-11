import { ColDef } from 'ag-grid-community';

import { DialFile } from '@/src/models/dial/file';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import FileNameCellRenderer from '@/src/components/Grid/CellRenderers/FileNameCellRenderer';
import { EntityOperationDeclaration } from '@/src/models/entity-operations';
import { getNameExtensionFromFile } from './get-extension';

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

export const getGridFileColumns = <T>(columns: ColDef[], actions: EntityOperationDeclaration<T>[]) => {
  const modifiedColDefs = [...columns].slice(0, 2).map((colDef, index) => {
    colDef.filter = false;
    colDef.floatingFilter = false;

    if (index === 0) {
      colDef.cellRenderer = FileNameCellRenderer;
    }

    if (index === 1) {
      colDef.maxWidth = 168;
    }

    return colDef;
  });
  return [...modifiedColDefs, ACTION_COLUMN(actions)];
};

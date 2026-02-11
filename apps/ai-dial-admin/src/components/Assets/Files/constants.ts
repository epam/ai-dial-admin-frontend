import { NAME_COLUMN, SIZE_COLUMN, UPDATED_AT_COLUMN } from '@epam/ai-dial-ui-kit';
import { ColDef } from 'ag-grid-community';

export const FILES_GRID_COLUMNS: ColDef[] = [
  NAME_COLUMN('Display name') as ColDef,
  UPDATED_AT_COLUMN('Updated time') as ColDef,
  SIZE_COLUMN('Size'),
];

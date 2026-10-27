import { NAME_COLUMN } from '@epam/ai-dial-react-file-manager';
import { ColDef } from 'ag-grid-community';

// Imported straight from the kit (as `FILES_GRID_COLUMNS` does) rather than via `getAssetNameColumn`: that
// module builds the per-view server-action maps at load time, which every importer of this picker would drag in.
export const SKILL_SELECT_GRID_COLUMNS: ColDef[] = [NAME_COLUMN('Name') as ColDef];

import { GridStatePersistenceOptions } from '@/src/components/Grid/models';

export const CREATE_FOLDER_FORBIDDEN_CHARS = /[:;,=/{}%&\\"]/;

/** Mirrors the control-character half of the ui-kit's default name validation, without its punctuation set. */
// eslint-disable-next-line no-control-regex
export const CONTROL_CHARS_ONLY_REGEXP = /[\0-\x1F]/;
export const NEW_FOLDER_NAME = 'New Folder';
export const FILE_NAME_MAX_LENGTH = 160;
export const MAX_FOLDER_NESTING_DEPTH = 4;
export const MOVE_ITEMS_INDICATOR_SIZE = 100;
export const MOVE_ITEMS_INDICATOR_WIDTH = 4;
export const MOVE_ITEMS_INDICATOR_DELAY = 500;
/**
 * What a file-manager list remembers: dragged widths, order, sort (filters always). Only a finished header
 * drag is the operator's — the grid also reports `api`, `flex` and `gridInitializing` resizes while it lays
 * out its flex columns. The list owns no columns panel, so it restores order itself.
 */
export const FILE_MANAGER_GRID_PERSISTENCE: GridStatePersistenceOptions = {
  persistedFields: ['width', 'sort', 'sortIndex', 'sortType'],
  userResizeSources: ['uiColumnResized'],
  shouldRestoreOrder: true,
};
export const SHOW_HIDDEN_FILES_STORAGE_KEY_PREFIX = 'file-manager-show-hidden-files';
/** Scopes file-manager-only grid styling in `scss/ag-grid.scss`. */
export const FILE_MANAGER_GRID_CLASS = 'file-manager-grid';
export const MOVE_EXCLUDED_PATHS = ['platform/', 'file/'];

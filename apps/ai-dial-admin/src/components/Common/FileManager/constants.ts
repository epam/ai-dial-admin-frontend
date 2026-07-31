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
export const ASSET_LIST_FILTER_STORAGE_KEY = 'assetListFilter_';

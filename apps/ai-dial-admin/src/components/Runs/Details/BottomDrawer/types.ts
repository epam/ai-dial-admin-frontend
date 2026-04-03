export type ViewMode = 'table' | 'pivot';
export type DetailMode = 'sidebar' | 'drawer';

export const DEFAULT_DRAWER_HEIGHT = 380;
export const MIN_DRAWER_HEIGHT = 200;
export const MAX_DRAWER_OFFSET = 100;
export const COLLAPSED_HEIGHT = 34;
export const RESIZE_STEP = 20;
export const RESIZE_STEP_LARGE = 100;

export interface ComparisonRow {
  fieldKey: string;
  label: string;
  badge?: 'bound' | 'info';
  isNumeric: boolean;
  values: Array<{ raw: string | null }>;
}

export interface ComparisonSection {
  key: string;
  label: string;
  rows: ComparisonRow[];
}

export interface DrawerPanelState {
  isOpen: boolean;
  panelHeight: number;
  isCollapsed: boolean;
  viewMode: ViewMode;
  activeId: string | null;
  pinnedId: string | null;
  currentHeight: number;
}

export interface DiffViewState {
  fieldLabel: string;
  original: string;
  modified: string;
}

export interface SpotlightedRow extends ComparisonRow {
  fullKey: string;
}

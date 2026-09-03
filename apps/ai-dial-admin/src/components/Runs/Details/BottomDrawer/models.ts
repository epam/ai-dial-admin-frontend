export enum DetailMode {
  Sidebar = 'sidebar',
  Drawer = 'drawer',
}

export interface CellValue {
  raw: string | null;
  /** true = metric was evaluated but produced null (failed); false/undefined = not evaluated or has a value */
  isFailed?: boolean;
}

export interface ComparisonRow {
  fieldKey: string;
  label: string;
  badge?: 'bound' | 'info';
  isNumeric: boolean;
  values: CellValue[];
}

export interface ComparisonSection {
  key: string;
  label: string;
  rows: ComparisonRow[];
}

export interface DiffViewState {
  fieldLabel: string;
  original: string;
  modified: string;
}

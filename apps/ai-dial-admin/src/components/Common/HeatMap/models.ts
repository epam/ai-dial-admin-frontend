export interface HeatMapGridRow {
  id: string;
  label: string;
  values: Record<string, number | null | undefined>;
  /** When true, value cells render empty (Compare metric group rows). */
  isGroup?: boolean;
}

export interface HeatMapCellTooltipSwatch {
  value: string;
  backgroundColor: string;
  borderColor: string;
}

/** Domain-free tooltip payload: labels are already translated. */
export interface HeatMapCellTooltipContent {
  rows: { label: string; value: string }[];
  valueLabel?: string;
  valueRow?: HeatMapCellTooltipSwatch;
  valueText?: string;
}

export enum HeatMapValueFormatMode {
  Absolute = 'absolute',
  Delta = 'delta',
}

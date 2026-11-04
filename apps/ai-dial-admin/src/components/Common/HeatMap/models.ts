export interface HeatMapGridRow {
  id: string;
  label: string;
  values: Record<string, number | null | undefined>;
  /** When true, value cells render empty (Compare metric group rows). */
  isGroup?: boolean;
}

export interface HeatMapCellTooltipSwatch {
  value: string;
  /** Tailwind `bg-*`/`border-*` classes — see `Common/ScoreCell/utils.ts`'s `getScoreCellBucketClasses`. */
  className: string;
}

/** Domain-free tooltip payload: labels are already translated. */
export interface HeatMapCellTooltipContent {
  rows: { label: string; value: string }[];
  valueLabel?: string;
  valueRow?: HeatMapCellTooltipSwatch;
  valueText?: string;
}

/** Published on the grid `context` by `HeatMapGrid`; read by the axis header and score cell renderers. */
export interface HeatMapGridContext {
  valueColumnLayoutWidth?: number;
}

export interface HeatMapValueTier {
  textClassName: string;
  paddingClassName: string;
  minWidthAbsolute: number;
  minWidthDelta: number;
}

export enum HeatMapTooltipCellResolutionSource {
  EventSource = 'eventSource',
  Pointer = 'pointer',
  DomQuery = 'domQuery',
  None = 'none',
}

export interface HeatMapTooltipCellResolution {
  element: HTMLElement | null;
  source: HeatMapTooltipCellResolutionSource;
}

export enum HeatMapTooltipPlacement {
  Below = 'below',
  Above = 'above',
}

export interface HeatMapTooltipRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export type HeatMapTooltipAnchor = HeatMapTooltipRect;
export type HeatMapTooltipFrame = HeatMapTooltipRect;

export interface HeatMapTooltipPosition {
  left: number;
  top: number;
  placement: HeatMapTooltipPlacement;
  arrowShift: number;
  isFixed: boolean;
}

export interface HeatMapTooltipParentFit {
  maxTop: number;
  belowTop: number;
  aboveTop: number;
  canFitBelow: boolean;
  canFitAbove: boolean;
}

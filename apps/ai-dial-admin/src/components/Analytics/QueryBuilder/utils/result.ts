import { ColDef, ITooltipParams, ValueFormatterParams, ValueGetterParams } from 'ag-grid-community';

import { RESULT_PREVIEW_CHARS, RESULT_TOOLTIP_MAX_CHARS } from '@/src/constants/analytics/query-builder';
import { StructuredQueryResult } from '@/src/models/analytics/query';

export const renderCell = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
};

// Above this a tooltip stops being a way to read the value: it cannot scroll, hold a selection, or
// survive the pointer moving, and it is bounded by the viewport whatever the value's size.
export const isFullValueNeeded = (text: string): boolean => text.length > RESULT_TOOLTIP_MAX_CHARS;

export const previewOf = (text: string): string =>
  text.length > RESULT_PREVIEW_CHARS ? `${text.slice(0, RESULT_PREVIEW_CHARS)}…` : text;

const unionKeys = (rows: Array<Record<string, unknown>>): string[] => {
  const set = new Set<string>();
  rows.forEach((row) => Object.keys(row).forEach((k) => set.add(k)));
  return [...set];
};

// `columnLabels` maps a result column to the display label its header shows — schema fields by their
// display name, computed columns absent since their alias is already the label (see ExecutedQueryMeta).
export const getResultColumns = (
  result: StructuredQueryResult | null,
  columnLabels: Record<string, string> = {},
): ColDef[] => {
  if (!result) return [];
  const cols = result.columns?.length ? result.columns : unionKeys(result.rows || []);
  return cols.map((col) => ({
    headerName: columnLabels[col] ?? col,
    field: col,
    // `field` alone makes ag-grid read a dotted column name (e.g. an enrichment's "table.column"
    // projection) as a nested-property path; the API always returns a flat row object keyed by the
    // literal column name, so resolve it directly — a `valueGetter` takes priority over `field`.
    valueGetter: (params: ValueGetterParams) => (params.data as Record<string, unknown> | undefined)?.[col],
    valueFormatter: (params: ValueFormatterParams) => renderCell(params.value),
    // The shared grid's default getter reads the raw value and its renderer drops anything that is not
    // a string, so an object cell had no tooltip at all.
    tooltipValueGetter: (params: ITooltipParams) => {
      const text = params.valueFormatted ?? renderCell(params.value);
      return isFullValueNeeded(text) ? undefined : text;
    },
  }));
};

export const getResultTotal = (result: StructuredQueryResult | null): number | null | undefined => {
  if (!result) return undefined;
  return result.totalCount;
};

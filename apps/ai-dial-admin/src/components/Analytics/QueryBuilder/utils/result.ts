import { ColDef, ValueFormatterParams, ValueGetterParams } from 'ag-grid-community';

import { StructuredQueryResult } from '@/src/models/analytics/query';

export const renderCell = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
};

const unionKeys = (rows: Array<Record<string, unknown>>): string[] => {
  const set = new Set<string>();
  rows.forEach((row) => Object.keys(row).forEach((k) => set.add(k)));
  return [...set];
};

export const getResultColumns = (result: StructuredQueryResult | null): ColDef[] => {
  if (!result) return [];
  const cols = result.columns?.length ? result.columns : unionKeys(result.rows || []);
  return cols.map((col) => ({
    headerName: col,
    field: col,
    // `field` alone makes ag-grid read a dotted column name (e.g. an enrichment's "table.column"
    // projection) as a nested-property path; the API always returns a flat row object keyed by the
    // literal column name, so resolve it directly — a `valueGetter` takes priority over `field`.
    valueGetter: (params: ValueGetterParams) => (params.data as Record<string, unknown> | undefined)?.[col],
    valueFormatter: (params: ValueFormatterParams) => renderCell(params.value),
  }));
};

export const getResultTotal = (result: StructuredQueryResult | null): number | null | undefined => {
  if (!result) return undefined;
  return result.totalCount;
};

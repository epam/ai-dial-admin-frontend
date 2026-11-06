import { ColDef } from 'ag-grid-community';

import DisplayNameCellRenderer from '@/src/components/Grid/CellRenderers/DisplayNameCellRenderer';
import LinkCellRenderer from '@/src/components/Grid/CellRenderers/LinkCellRenderer';
import { EntityHrefGetter } from '@/src/components/Grid/CellRenderers/models';
import TitleSubtitleCellRenderer from '@/src/components/Grid/CellRenderers/TitleSubtitleCellRenderer';

const LINKABLE_RENDERERS: ColDef['cellRenderer'][] = [DisplayNameCellRenderer, TitleSubtitleCellRenderer];

const isNameColumn = (column: ColDef, nameField?: string): boolean =>
  !!nameField && (column.colId ?? column.field) === nameField;

export const withNameLink = (
  columns: ColDef[],
  getHref: EntityHrefGetter,
  nameField?: string,
  linkParams?: Record<string, unknown>,
): ColDef[] =>
  columns.map((column) => {
    const isDisplayName = column.cellRenderer === DisplayNameCellRenderer;
    if (!isDisplayName && !isNameColumn(column, nameField)) {
      return column;
    }
    if (LINKABLE_RENDERERS.includes(column.cellRenderer)) {
      return { ...column, cellRendererParams: { ...column.cellRendererParams, ...linkParams, getHref } };
    }
    if (!column.cellRenderer) {
      return { ...column, cellRenderer: LinkCellRenderer, cellRendererParams: { ...linkParams, getHref } };
    }
    return column;
  });

export const moveColumnFirst = (columns: ColDef[], field: string, afterFields: string[] = []): ColDef[] => {
  const column = columns.find((col) => col.field === field);
  if (!column) {
    return columns;
  }
  const rest = columns.filter((col) => col !== column);
  const leading = rest.filter((col) => !!col.field && afterFields.includes(col.field));
  return [...leading, column, ...rest.filter((col) => !leading.includes(col))];
};

import { ColDef } from 'ag-grid-community';

import {
  formatAttachment,
  getTopics,
  sourceTypeFormatter,
  sourceValueFormatter,
} from '@/src/constants/grid-columns/formatters';
import { ApplicationRoute } from '@/src/types/routes';

import TagsCellRenderer from '@/src/components/Grid/CellRenderers/TagsCellRenderer';
import TelemetryFallbackCellRenderer from '@/src/components/Grid/CellRenderers/TelemetryFallbackCellRenderer';
import ValidityStatusCellRenderer from '@/src/components/Grid/CellRenderers/ValidityStatusCellRenderer';
import { TelemetryI18nKey } from '@/src/constants/i18n';
import { dateTimeColumn } from './configs';
import { getValidityStatus } from '@/src/components/Common/ValidityStatus/utils';

export const CREATED_AT_COLUMN: ColDef = {
  field: 'createdAt',
  headerName: 'Creation time',
  hide: false,
  ...dateTimeColumn,
};

export const UPDATED_AT_COLUMN: ColDef = {
  field: 'updatedAt',
  headerName: 'Updated time',
  hide: false,
  ...dateTimeColumn,
};

export const DESCRIPTION_COLUMN: ColDef = {
  field: 'description',
  colId: 'description',
  headerName: 'Description',
  hide: false,
};

export const VERSION_COLUMN: ColDef = {
  field: 'version',
  colId: 'version',
  headerName: 'Version',
  hide: false,
  valueFormatter: (params) => params.value,
};

export const COMPLETION_TIME_COL_ID = 'completion_time';

export const COMPLETION_TIME_COLUMN: ColDef = {
  field: COMPLETION_TIME_COL_ID,
  headerName: 'Completion Time',
  hide: false,
  sort: 'desc',
  sortable: true,
  sortingOrder: ['asc', 'desc'],
  filter: false,
  floatingFilter: false,
  ...dateTimeColumn,
};

export const AUTHOR_COLUMN: ColDef = { field: 'author', colId: 'author', headerName: 'Author', hide: false };

export const DISPLAY_NAME_COLUMN: ColDef = {
  field: 'displayName',
  colId: 'displayName',
  headerName: 'Display Name',
  hide: false,
};

export const DISPLAY_NAME_COLUMN_WITH_SORT: ColDef = { ...DISPLAY_NAME_COLUMN, sort: 'asc' };

export const NAME_COLUMN: ColDef = { field: 'name', colId: 'name', headerName: 'ID', hide: false };

export const ASSET_NAME_COLUMN: ColDef = { field: 'name', colId: 'name', headerName: 'Display Name' };

export const NAME_COLUMN_WITH_SORT: ColDef = { ...NAME_COLUMN, sort: 'asc' };

export const DISPLAY_VERSION_COLUMN: ColDef = {
  field: 'displayVersion',
  colId: 'displayVersion',
  headerName: 'Version',
  hide: false,
  valueFormatter: (params) => params.value,
};

export const ENDPOINT_COLUMN: ColDef = { field: 'endpoint', headerName: 'Endpoint', hide: false };

export const TOPICS_COLUMN: ColDef = {
  field: 'topics',
  colId: 'topics',
  headerName: 'Topics',
  cellRenderer: TagsCellRenderer,
  cellRendererParams: (params: { data?: { topics?: string[]; descriptionKeywords?: string[] } }) => ({
    items: getTopics(params.data),
  }),
  filterValueGetter: (params) => getTopics(params.data),
  tooltipValueGetter: (params) => getTopics(params.data)?.join(', ') || null,
  hide: false,
};

export const BASE_STATUS_COLUMN: ColDef = {
  field: 'status',
  headerName: 'Status',
  hide: false,
};

export const ORDER_COLUMN: ColDef = {
  field: 'order',
  colId: 'order',
  headerName: 'Order',
  hide: false,
};

export const PATHS_COLUMN: ColDef = {
  field: 'paths',
  colId: 'paths',
  headerName: 'Paths',
  cellRenderer: TagsCellRenderer,
  cellRendererParams: (params: { data?: { paths?: string[] } }) => ({
    items: params.data?.paths,
  }),
  filterValueGetter: (params) => params.data?.paths,
  tooltipValueGetter: (params) => params.data?.paths?.join(', ') || null,
  hide: false,
};

export const VALIDITY_STATUS_COLUMN = (t: (str: string) => string): ColDef => {
  return {
    ...BASE_STATUS_COLUMN,
    cellRenderer: ValidityStatusCellRenderer,
    filterValueGetter: ({ data }) => getValidityStatus(data?.validityState.valid, t).title,
  };
};

export const ATTACHMENT_COLUMN: ColDef = {
  field: 'inputAttachmentTypes',
  headerName: 'Attachment types',
  hide: true,
  valueFormatter: ({ value }) => formatAttachment(value),
  filterValueGetter: (params) => formatAttachment(params.data[params.colDef.field || '']),
  tooltipValueGetter: ({ value }) => formatAttachment(value),
};

export const SOURCE_TYPE_COLUMN = (
  t: (key: string) => string,
  view?: ApplicationRoute,
  codeAppEditorUrl?: string,
): ColDef => ({
  field: 'source.$type',
  headerName: 'Source type',
  hide: false,
  valueFormatter: ({ value, data }) => sourceTypeFormatter(value, t, view, data, codeAppEditorUrl),
  filterValueGetter: (params) =>
    sourceTypeFormatter(
      (params.data as { source: { $type: string } }).source.$type,
      t,
      view,
      params.data,
      codeAppEditorUrl,
    ),
  tooltipValueGetter: ({ value, data }) => sourceTypeFormatter(value, t, view, data, codeAppEditorUrl),
});

const SOURCE_VALUE_COLUMN = (view?: ApplicationRoute): ColDef => ({
  field: 'endpoint',
  headerName: 'Source',
  hide: false,
  valueFormatter: ({ data, value }) => sourceValueFormatter(data, value, view) || '',
  filterValueGetter: ({ data, colDef }) => sourceValueFormatter(data, data[colDef.field || ''], view),
  tooltipValueGetter: ({ data, value }) => sourceValueFormatter(data, value, view),
});

export const SOURCE_FIELD_COLUMNS = (
  t: (key: string) => string,
  view?: ApplicationRoute,
  codeAppEditorUrl?: string,
): ColDef[] => [SOURCE_TYPE_COLUMN(t, view, codeAppEditorUrl), SOURCE_VALUE_COLUMN(view)];

export const TYPE_COLUMN = (t: (str: string) => string): ColDef => {
  return {
    field: 'type',
    headerName: 'Entity type',
    valueFormatter: (params) => t(params.value),
    filterValueGetter: (params) => t(params.data[params.colDef.field || ''] as string),
    tooltipValueGetter: (params) => t(params.value),
  };
};

export const MAX_INPUT_ATTACHMENTS_COLUMN: ColDef = {
  field: 'maxInputAttachments',
  headerName: 'Max attachment number',
  hide: true,
};

export const CALLS_PROJECT_COLUMN = (t: (str: string) => string): ColDef => ({
  field: 'name',
  headerName: 'Project',
  hide: false,
  valueFormatter: ({ value }) => (!value || value === 'undefined' ? t(TelemetryI18nKey.NoProject) : value),
  cellRenderer: TelemetryFallbackCellRenderer,
  cellRendererParams: { tooltip: t(TelemetryI18nKey.NoProjectTooltip) },
});

export const CALLS_PARENT_DEPLOYMENT_COLUMN = (
  t: (str: string) => string,
  tooltipKey: string = TelemetryI18nKey.DirectCallTooltip,
): ColDef => ({
  field: 'parent_deployment',
  headerName: 'Parent Deployment',
  hide: false,
  valueFormatter: ({ value }) => (!value || value === 'undefined' ? t(TelemetryI18nKey.DirectCall) : value),
  cellRenderer: TelemetryFallbackCellRenderer,
  cellRendererParams: { tooltip: t(tooltipKey) },
});

'use client';

import Cloud from '@/public/images/icons/cloud.svg';
import { ColDef, ICellRendererParams, ITooltipParams, ValueGetterParams } from 'ag-grid-community';
import { capitalize } from 'lodash';

import StatusIndicator from '@/src/components/Deployments/Common/StatusIndicator/StatusIndicator';
import VersionsSelect from '@/src/components/Deployments/Common/VersionsSelect/VersionsSelect';
import EditableCellRenderer from '@/src/components/Grid/CellRenderers/EditableCellRenderer';
import ExternalUrlCellRenderer from '@/src/components/Grid/CellRenderers/ExternalUrlCellRenderer';
import FileSelectCellRenderer from '@/src/components/Grid/CellRenderers/FileSelectCellRenderer';
import ImportValidationCellRenderer from '@/src/components/Grid/CellRenderers/ImportValidationCellRenderer';
import RunStatusCellRenderer from '@/src/components/Grid/CellRenderers/RunStatusCellRenderer';
import SelectCellRenderer from '@/src/components/Grid/CellRenderers/SelectCellRenderer';
import TagsCellRenderer from '@/src/components/Grid/CellRenderers/TagsCellRenderer';
import { numberValueComparator } from '@/src/components/Grid/comparators/number-comparator';
import { ACTION_COLUMN, NO_BORDER_CLASS } from '@/src/constants/ag-grid';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { EVENT_TYPES, MODEL_TYPES, POD_OBJECT_KIND } from '@/src/constants/deployments/containers';
import {
  IMAGE_SOURCE_TYPE_I18N_KEYS,
  IMAGE_TRANSPORT_I18N_KEYS,
  IMAGE_TYPE_I18N_KEYS,
  STATUS_I18N_KEYS,
} from '@/src/constants/deployments/images';
import { ROW_IMPORT_META_KEY } from '@/src/constants/import';
import { BasicI18nKey, EntityFieldsI18nKey, ImportI18nKey, SourceI18nKey } from '@/src/constants/i18n';
import { RowImportMeta } from '@/src/models/deployments/import';
import { ValidationState } from '@/src/types/deployments/import';
import {
  containerSourceNameLabel,
  containerSourceTypeLabel,
  formatCpuColumnValue,
  formatGpuColumnValue,
  formatMemoryColumnValue,
  formatRequired,
  getCpuColumnValue,
  getFormattedResourceType,
  getGpuColumnValue,
  getMemoryColumnValue,
  numberValueFormatter,
  priceValueFormatter,
} from '@/src/constants/grid-columns/formatters';
import { ImageVersion } from '@/src/models/deployments/images';
import { DialPrompt } from '@/src/models/dial/prompt';
import { Publication } from '@/src/models/dial/publications';
import { TestSuiteRequestTemplateParam } from '@/src/models/evaluation/test-suite';
import { FormDataPart, FormDataType } from '@/src/models/form-data';
import { CONTAINER_STATUS, KubEventType, MODEL_TYPE } from '@/src/types/deployments/containers';
import { IMAGE_SOURCE_TYPE, IMAGE_STATUS, IMAGE_TRANSPORT_TYPE, IMAGE_TYPE } from '@/src/types/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';
import { formatDeploymentImageName } from '@/src/utils/formatting/deployments';
import { formatNumberWithExponent } from '@/src/utils/formatting/number-formatting';
import { isAssetWithVersion } from '@/src/utils/is-view';
import { getDeleteOperation, getDuplicateOperation, getMoveOperation, getOpenInNewTabOperation } from './actions';
import {
  ASSET_NAME_COLUMN,
  ATTACHMENT_COLUMN,
  AUTHOR_COLUMN,
  BASE_STATUS_COLUMN,
  COMPLETION_TIME_COLUMN,
  CREATED_AT_COLUMN,
  DESCRIPTION_COLUMN,
  DISPLAY_NAME_COLUMN,
  DISPLAY_NAME_COLUMN_WITH_SORT,
  DISPLAY_VERSION_COLUMN,
  MAX_INPUT_ATTACHMENTS_COLUMN,
  NAME_COLUMN,
  NAME_COLUMN_WITH_SORT,
  ORDER_COLUMN,
  PATHS_COLUMN,
  SOURCE_FIELD_COLUMNS,
  TOPICS_COLUMN,
  UPDATED_AT_COLUMN,
  VALIDITY_STATUS_COLUMN,
  VERSION_COLUMN,
} from './base-columns';
import { dateTimeColumn, numericColumn, priceColumn } from './configs';
import { baseNumberFilter, baseStringFilter, dateFilter, evalStringFilter } from './filters';
import RowExpanderCellRenderer from '@/src/components/Grid/CellRenderers/RowExpanderCellRenderer';
import ChildrenActivityTypeCellRenderer from '@/src/components/Grid/CellRenderers/ChildrenActivityTypeCellRenderer';
import { ActivityAuditView } from '@/src/types/activity-audit';
import { GridFilterType } from '@/src/types/grid-filter';

export const COLUMN_PANEL_PREFIX = 'column_';

export const RESOURCE_TYPE_COLUMN = 'resourceType';

export const BASE_COLUMNS: ColDef[] = [DISPLAY_NAME_COLUMN_WITH_SORT, DESCRIPTION_COLUMN, NAME_COLUMN];

export const BASE_COLUMNS_WITH_TOPICS: ColDef[] = [
  ...BASE_COLUMNS,
  TOPICS_COLUMN,
  { ...CREATED_AT_COLUMN, filter: false },
  { ...UPDATED_AT_COLUMN, filter: false },
];

export const DEPENDENCIES_COLUMNS = [DISPLAY_NAME_COLUMN, VERSION_COLUMN, DESCRIPTION_COLUMN, NAME_COLUMN];

export const ADAPTER_COLUMNS = (t: (str: string) => string): ColDef[] => [
  ...BASE_COLUMNS,
  TOPICS_COLUMN,
  ...SOURCE_FIELD_COLUMNS(t, ApplicationRoute.Adapters),
  { ...CREATED_AT_COLUMN, filter: false },
  { ...UPDATED_AT_COLUMN, filter: false },
];

export const MODELS_COLUMNS = (t: (str: string) => string): ColDef[] => [
  DISPLAY_NAME_COLUMN_WITH_SORT,
  DISPLAY_VERSION_COLUMN,
  DESCRIPTION_COLUMN,
  NAME_COLUMN,
  ...SOURCE_FIELD_COLUMNS(t, ApplicationRoute.Models),
  AUTHOR_COLUMN,
  TOPICS_COLUMN,
  { ...CREATED_AT_COLUMN, filter: false },
  { ...UPDATED_AT_COLUMN, filter: false },
  ATTACHMENT_COLUMN(t),
  MAX_INPUT_ATTACHMENTS_COLUMN,
  {
    field: 'limits.maxTotalTokens',
    headerName: 'Interaction limit',
    hide: true,
    tooltipValueGetter: (params) => params.data?.limits?.maxTotalTokens,
  },
  {
    field: 'pricing.prompt',
    headerName: 'Prompt price',
    hide: true,
    tooltipValueGetter: (params) => params.data?.pricing?.prompt,
  },
  {
    field: 'pricing.completion',
    headerName: 'Completion price',
    hide: true,
    tooltipValueGetter: (params) => params.data?.pricing?.completion,
  },
];

export const APPLICATIONS_COLUMNS = (t: (str: string) => string): ColDef[] => [
  DISPLAY_NAME_COLUMN_WITH_SORT,
  DISPLAY_VERSION_COLUMN,
  DESCRIPTION_COLUMN,
  NAME_COLUMN,
  ...SOURCE_FIELD_COLUMNS(t, ApplicationRoute.Applications),
  VALIDITY_STATUS_COLUMN(t),
  AUTHOR_COLUMN,
  TOPICS_COLUMN,
  { ...CREATED_AT_COLUMN, filter: false },
  { ...UPDATED_AT_COLUMN, filter: false },
  ATTACHMENT_COLUMN(t),
  MAX_INPUT_ATTACHMENTS_COLUMN,
];

export const TOOLSETS_COLUMNS = (t: (str: string) => string): ColDef[] => [
  DISPLAY_NAME_COLUMN,
  DESCRIPTION_COLUMN,
  NAME_COLUMN_WITH_SORT,
  ...SOURCE_FIELD_COLUMNS(t, ApplicationRoute.Toolsets),
  AUTHOR_COLUMN,
  TOPICS_COLUMN,
  { ...CREATED_AT_COLUMN, filter: false },
  { ...UPDATED_AT_COLUMN, filter: false },
];

export const INTERCEPTORS_COLUMNS = (t: (str: string) => string): ColDef[] => [
  DISPLAY_NAME_COLUMN,
  DESCRIPTION_COLUMN,
  NAME_COLUMN_WITH_SORT,
  ...SOURCE_FIELD_COLUMNS(t, ApplicationRoute.Interceptors),
  AUTHOR_COLUMN,
  TOPICS_COLUMN,
  { ...CREATED_AT_COLUMN, filter: false },
  { ...UPDATED_AT_COLUMN, filter: false },
  BASE_STATUS_COLUMN,
];

export const ROUTES_COLUMNS: ColDef[] = [
  DISPLAY_NAME_COLUMN,
  DESCRIPTION_COLUMN,
  NAME_COLUMN_WITH_SORT,
  PATHS_COLUMN,
  ORDER_COLUMN,
  TOPICS_COLUMN,
  { ...CREATED_AT_COLUMN, filter: false },
  { ...UPDATED_AT_COLUMN, filter: false },
];

export const EVALUATION_DEPLOYMENTS_COLUMNS: ColDef[] = [
  DISPLAY_NAME_COLUMN_WITH_SORT,
  { field: 'deploymentId', headerName: 'ID', hide: false },
  DESCRIPTION_COLUMN,
];

export const MCP_DEPLOYMENTS_COLUMNS: ColDef[] = [
  DISPLAY_NAME_COLUMN_WITH_SORT,
  { field: 'deploymentId', headerName: 'ID', hide: false },
  { field: 'transport', headerName: 'Transport', hide: false },
];

export const MCP_TOOLS_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'Tool Name', hide: false },
  DESCRIPTION_COLUMN,
  {
    field: 'inputSchemaFieldCount',
    headerName: 'Input Schema Fields',
    hide: false,
    valueGetter: (params) => {
      const schema = params.data?.inputSchema;
      if (schema?.properties) {
        return Object.keys(schema.properties).length;
      }
      return 0;
    },
  },
];

export const ACTIVITY_AUDIT_COLUMNS = (
  t: (s: string) => string,
  view: ActivityAuditView = ActivityAuditView.Config,
  isSingleEntity = false,
): ColDef[] => [
  ...(!isSingleEntity && view === ActivityAuditView.Config
    ? [
        {
          headerName: '',
          field: 'expanderColumn',
          cellClass: NO_BORDER_CLASS,
          flex: 1,
          maxWidth: 30,
          sortable: false,
          filter: false,
          floatingFilter: false,
          cellRenderer: RowExpanderCellRenderer,
        } as ColDef,
      ]
    : []),
  {
    field: 'activityType',
    headerName: 'Activity type',
    ...baseStringFilter,
    cellRenderer: ChildrenActivityTypeCellRenderer,
    cellRendererParams: {
      showIcon: !isSingleEntity,
    },
  },
  ...(!isSingleEntity
    ? [
        {
          field: RESOURCE_TYPE_COLUMN,
          headerName: 'Resource type',
          valueFormatter: ({ value }) => getFormattedResourceType(value, t),
          tooltipValueGetter: ({ value }) => getFormattedResourceType(value, t),
          ...baseStringFilter,
        } as ColDef,
        { field: 'resourceId', headerName: 'Resource identifier', ...baseStringFilter } as ColDef,
      ]
    : []),
  ...(view === ActivityAuditView.Deployments
    ? [{ field: 'version', headerName: 'Version', ...baseStringFilter } as ColDef]
    : []),
  {
    field: 'epochTimestampMs',
    headerName: 'Time',
    sort: 'desc',
    ...dateTimeColumn,
    floatingFilter: false,
    filter: false,
  },
  { field: 'initiatedEmail', headerName: 'Initiated', ...baseStringFilter },
  { field: 'activityId', headerName: 'Activity ID', ...baseStringFilter },
  { field: 'parentActivityId', headerName: 'Parent ID', ...baseStringFilter },
];

export const BASE_KEYS_COLUMNS: ColDef[] = [
  DISPLAY_NAME_COLUMN,
  DESCRIPTION_COLUMN,
  NAME_COLUMN_WITH_SORT,
  { ...CREATED_AT_COLUMN, filter: false },
  { ...UPDATED_AT_COLUMN, filter: false },
  {
    field: 'keyGeneratedAt',
    headerName: 'Key generation time',
    ...dateTimeColumn,
  },
  {
    field: 'expiresAt',
    headerName: 'Expiration time',
    ...dateTimeColumn,
  },
];

export const KEYS_COLUMNS = (t: (str: string) => string): ColDef[] => [
  ...BASE_KEYS_COLUMNS,
  VALIDITY_STATUS_COLUMN(t),
  TOPICS_COLUMN,
  { ...CREATED_AT_COLUMN, filter: false },
  { ...UPDATED_AT_COLUMN, filter: false },
  {
    headerName: 'Project',
    field: 'project',
    hide: false,
  },
  {
    headerName: 'Project contact point',
    field: 'projectContactPoint',
    hide: true,
  },
  {
    headerName: 'Secured',
    field: 'secured',
    hide: true,
  },
];

export const RUNNERS_COLUMNS: ColDef[] = [
  { field: 'dial:applicationTypeDisplayName', headerName: 'Display Name', sort: 'asc' },
  DESCRIPTION_COLUMN,
  { field: '$id', headerName: 'ID' },
];

export const LIST_RUNNER_COLUMNS: ColDef[] = [
  ...RUNNERS_COLUMNS,
  TOPICS_COLUMN,
  { ...CREATED_AT_COLUMN, filter: false },
  { ...UPDATED_AT_COLUMN, filter: false },
];

export const INTERCEPTOR_TEMPLATES_COLUMNS: ColDef[] = [
  ...BASE_COLUMNS,
  TOPICS_COLUMN,
  { ...CREATED_AT_COLUMN, filter: false },
  { ...UPDATED_AT_COLUMN, filter: false },
];

export const ASSETS_COLUMNS: ColDef[] = [
  VERSION_COLUMN,
  AUTHOR_COLUMN,
  { ...CREATED_AT_COLUMN, filter: false },
  { ...UPDATED_AT_COLUMN, filter: false },
];

export const DEPLOYMENT_ASSETS_COLUMNS: ColDef[] = [NAME_COLUMN, ...ASSETS_COLUMNS];

export const NON_DEPLOYMENT_ASSETS_COLUMNS: ColDef[] = [ASSET_NAME_COLUMN, ...ASSETS_COLUMNS];

export const FILES_COLUMNS: ColDef[] = [
  {
    ...ASSET_NAME_COLUMN,
    valueFormatter: ({ value }) => value,
    tooltipValueGetter: () => '',
  },
  { field: 'extension', headerName: 'Extension', tooltipValueGetter: () => '' },
  AUTHOR_COLUMN,
];

export const EXPORT_COLUMNS = (
  onChange: (value: string[], data: unknown, field: string, index: number, isSelected: boolean) => void,
  route?: ApplicationRoute,
): ColDef[] => {
  const columns: ColDef[] = [NAME_COLUMN_WITH_SORT, AUTHOR_COLUMN];

  if (isAssetWithVersion(route)) {
    columns.splice(1, 0, {
      headerName: 'Version',
      field: 'version',
      sortable: true,
      filter: true,
      cellClass: NO_BORDER_CLASS,
      cellRenderer: SelectCellRenderer,
      cellRendererParams: {
        getItems: (data: DialPrompt) => data.versions?.map((v) => ({ value: v, label: v })),
        onChange,
        isMulti: true,
      },
    });
  }

  if (route === ApplicationRoute.Files) {
    return FILES_COLUMNS;
  }

  return columns;
};

export const PUBLICATION_COLUMNS: ColDef[] = [
  { field: 'requestName', headerName: 'Name' },
  AUTHOR_COLUMN,
  { ...CREATED_AT_COLUMN, sort: 'asc' },
];

export const getPublicationColumns = (open: (publication?: Publication) => void): ColDef[] => {
  const actions = [getOpenInNewTabOperation(open)];

  return [...PUBLICATION_COLUMNS, ACTION_COLUMN(actions)];
};

export const ENTITIES_COLUMNS = <T extends object>(
  columns: ColDef[],
  remove?: (entity?: T) => void,
  duplicate?: (entity?: T) => void,
  open?: (entity?: T) => void,
  move?: (entity?: T) => void,
): ColDef[] => {
  const actions = [];
  if (open) {
    actions.push(getOpenInNewTabOperation(open));
  }
  if (duplicate) {
    actions.push(getDuplicateOperation(duplicate));
  }
  if (move) {
    actions.push(getMoveOperation(move));
  }
  if (remove) {
    actions.push(getDeleteOperation(remove));
  }
  return [...columns, ACTION_COLUMN(actions)];
};

export const TELEMETRY_COLUMNS: ColDef[] = [
  {
    field: 'requests',
    headerName: 'Request Count',
    ...numericColumn,
  },
  {
    field: 'prompts',
    headerName: 'Prompt Tokens',
    ...numericColumn,
  },
  {
    field: 'completions',
    headerName: 'Completion tokens',
    ...numericColumn,
  },
  {
    field: 'cost',
    headerName: 'Money',
    sort: 'desc',
    ...numericColumn,
    valueFormatter: ({ value }) => `$${numberValueFormatter(priceValueFormatter(value) as string)}`,
    filterValueGetter: (params) =>
      numberValueFormatter(priceValueFormatter(params.data[params.colDef.field || '']) as string),
  },
];

export const TELEMETRY_GRID_COLUMNS: ColDef[] = [
  NAME_COLUMN,
  ...TELEMETRY_COLUMNS,
  {
    field: 'deployment_cost',
    headerName: 'Total money',
    ...numericColumn,
    valueFormatter: ({ value }) => `$${numberValueFormatter(priceValueFormatter(value) as string)}`,
    filterValueGetter: (params) =>
      numberValueFormatter(priceValueFormatter(params.data[params.colDef.field || '']) as string),
  },
];

// Sets `sortable: false` on every column except those whose field is in
// `sortableFields`. Used by Usage Log grids to lock sort to completion_time —
// non-time sorts only order rows within one day-chunk, which breaks the
// user's intuition. New columns added to any of the arrays below inherit
// the lock automatically.
const restrictSort = (cols: ColDef[], sortableFields: string[] = []): ColDef[] =>
  cols.map((col) => (col.field && sortableFields.includes(col.field) ? col : { ...col, sortable: false }));

const BASE_USAGE_LOG_TRACES_COLUMNS: ColDef[] = [
  COMPLETION_TIME_COLUMN,
  { field: 'trace_id', headerName: 'Trace ID', hide: false, ...baseStringFilter },
  { field: 'topic', headerName: 'Topic', hide: false, ...baseStringFilter },
  // { field: 'reactions', headerName: 'Reactions', hide: true , ...baseStringFilter}, // TODO: not implemented
  {
    field: 'cached_prompt_tokens',
    headerName: 'Cached Prompt Tokens',
    hide: true,
    ...numericColumn,
    ...baseNumberFilter,
  },
  { field: 'prompt_tokens', headerName: 'Prompt Tokens', hide: false, ...numericColumn, ...baseNumberFilter },
  { field: 'completion_tokens', headerName: 'Completion Tokens', hide: false, ...numericColumn, ...baseNumberFilter },
  {
    field: 'deployment_price',
    headerName: 'Deployment Price',
    minWidth: 180,
    hide: false,
    ...priceColumn('Deployment Price'),
    ...baseNumberFilter,
  },
  { field: 'price', headerName: 'Total Price', hide: false, ...priceColumn('Total Price'), ...baseNumberFilter },
  {
    field: 'number_request_messages',
    headerName: 'Number of Request Messages',
    hide: true,
    ...numericColumn,
    ...baseNumberFilter,
  },
  { field: 'deployment', headerName: 'Deployment ID', hide: false, ...baseStringFilter },
  { field: 'parent_deployment', headerName: 'Parent Deployment ID', hide: true, ...baseStringFilter },
  { field: 'model', headerName: 'Model', hide: true, ...baseStringFilter },
  { field: 'project_id', headerName: 'Project', hide: false, ...baseStringFilter },
  { field: 'upstream', headerName: 'Upstream', hide: true, ...baseStringFilter },
  { field: 'execution_path', headerName: 'Execution Path', hide: true, ...baseStringFilter },
  { field: 'user_hash', headerName: 'User', hide: false, ...baseStringFilter },
  { field: 'user_title', headerName: 'User Title', hide: true, ...baseStringFilter },
  { field: 'language', headerName: 'Language', hide: true, ...baseStringFilter },
  { field: 'response_id', headerName: 'Response ID', hide: true, ...baseStringFilter },
  { field: 'chat_id', headerName: 'Conversation ID', hide: true, ...baseStringFilter },
  { field: 'core_span_id', headerName: 'Core span ID', hide: true, ...baseStringFilter },
  { field: 'core_parent_span_id', headerName: 'Core parent span ID', hide: false, ...baseStringFilter },
];
export const USAGE_LOG_TRACES_COLUMNS = restrictSort(BASE_USAGE_LOG_TRACES_COLUMNS, ['completion_time']);

const BASE_USAGE_LOG_CONVERSATIONS_COLUMNS: ColDef[] = [
  COMPLETION_TIME_COLUMN,
  { field: 'chat_id', headerName: 'Conversation ID', hide: false, ...baseStringFilter },
  { field: 'topic', headerName: 'Topic', hide: false, ...baseStringFilter },
  {
    field: 'cached_prompt_tokens',
    headerName: 'Cached Prompt Tokens',
    hide: true,
    ...numericColumn,
    ...baseNumberFilter,
  },
  { field: 'prompt_tokens', headerName: 'Prompt Tokens', hide: false, ...numericColumn, ...baseNumberFilter },
  { field: 'completion_tokens', headerName: 'Completion Tokens', hide: false, ...numericColumn, ...baseNumberFilter },
  {
    field: 'deployment_price',
    headerName: 'Total Price',
    hide: false,
    ...priceColumn('Total Price'),
    ...baseNumberFilter,
  },
  {
    field: 'number_request_messages',
    headerName: 'Number of Request Messages',
    hide: true,
    ...numericColumn,
    ...baseNumberFilter,
  },
  { field: 'deployment', headerName: 'Deployment ID', hide: false, ...baseStringFilter },
  { field: 'project_id', headerName: 'Project', hide: false, ...baseStringFilter },
  { field: 'user_hash', headerName: 'User', hide: false, ...baseStringFilter },
  { field: 'user_title', headerName: 'User Title', hide: true, ...baseStringFilter },
  { field: 'language', headerName: 'Language', hide: true, ...baseStringFilter },
];
export const USAGE_LOG_CONVERSATIONS_COLUMNS = restrictSort(BASE_USAGE_LOG_CONVERSATIONS_COLUMNS, ['completion_time']);

const BASE_USAGE_LOG_MCP_COLUMNS: ColDef[] = [
  COMPLETION_TIME_COLUMN,
  { field: 'deployment', headerName: 'Deployment ID', hide: false, ...baseStringFilter },
  { field: 'project_id', headerName: 'Project', hide: false, ...baseStringFilter },
  { field: 'mcp_method', headerName: 'Method', hide: true, ...baseStringFilter },
  { field: 'mcp_tool_call_name', headerName: 'Tool Name', hide: false, ...baseStringFilter },
  { field: 'trace_id', headerName: 'Trace ID', hide: false, ...baseStringFilter },
];
export const USAGE_LOG_MCP_COLUMNS = restrictSort(BASE_USAGE_LOG_MCP_COLUMNS, ['completion_time']);

const BASE_USAGE_LOG_ROUTES_COLUMNS: ColDef[] = [
  COMPLETION_TIME_COLUMN,
  { field: 'project_id', headerName: 'Project', hide: false, ...baseStringFilter },
  { field: 'deployment', headerName: 'Deployment ID', hide: false, ...baseStringFilter },
  { field: 'route_path', headerName: 'Route', hide: true, ...baseStringFilter },
  { field: 'http_method', headerName: 'Method', hide: true, ...baseStringFilter },
  { field: 'upstream', headerName: 'Upstream', hide: false, ...baseStringFilter },
  { field: 'trace_id', headerName: 'Trace ID', hide: false, ...baseStringFilter },
];
export const USAGE_LOG_ROUTES_COLUMNS = restrictSort(BASE_USAGE_LOG_ROUTES_COLUMNS, ['completion_time']);

const BASE_USAGE_LOG_TOOLSET_TRACES_COLUMNS: ColDef[] = [
  COMPLETION_TIME_COLUMN,
  { field: 'project_id', headerName: 'Project', hide: false, ...baseStringFilter },
  { field: 'mcp_method', headerName: 'Method', hide: true, ...baseStringFilter },
  { field: 'mcp_tool_call_name', headerName: 'Tool Name', hide: false, ...baseStringFilter },
  { field: 'trace_id', headerName: 'Trace ID', hide: false, ...baseStringFilter },
];
export const USAGE_LOG_TOOLSET_TRACES_COLUMNS = restrictSort(BASE_USAGE_LOG_TOOLSET_TRACES_COLUMNS, [
  'completion_time',
]);

// Derived from the column defs — any column spread with ...numericColumn or
// ...priceColumn(...) carries cellClass 'align-right', which we treat as the
// marker for backend-numeric columns (see translateUsageLogTextFilter).
export const USAGE_LOG_NUMERIC_COLUMNS = new Set<string>(
  [
    ...USAGE_LOG_TRACES_COLUMNS,
    ...USAGE_LOG_CONVERSATIONS_COLUMNS,
    ...USAGE_LOG_MCP_COLUMNS,
    ...USAGE_LOG_TOOLSET_TRACES_COLUMNS,
  ]
    .filter((c) => c.cellClass === 'align-right' && c.field)
    .map((c) => c.field as string),
);

export const PROJECT_GRID_COLUMNS: ColDef[] = [{ field: 'name', headerName: 'Project' }, ...TELEMETRY_COLUMNS];

export const MCP_CONSUMPTION_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'MCP Name', hide: false },
  { field: 'requests', headerName: 'Calls', hide: false, ...numericColumn },
];

export const TOOLS_CONSUMPTION_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'MCP Name', hide: false },
  { field: 'mcp_tool_call_name', headerName: 'Tool', hide: false },
  { field: 'requests', headerName: 'Calls', hide: false, ...numericColumn },
];

export const MCP_CALLS_BY_DEPLOYMENT_COLUMNS: ColDef[] = [
  { field: 'parent_deployment', headerName: 'Deployment Name', hide: false },
  { field: 'name', headerName: 'MCP Name', hide: false },
  { field: 'requests', headerName: 'Calls', hide: false, ...numericColumn },
];

export const MCP_PROJECTS_CONSUMPTION_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'Project', hide: false },
  { field: 'tool_calls', headerName: 'Tool Calls', hide: false, ...numericColumn },
  { field: 'mcp_calls', headerName: 'MCP Calls', hide: false, sort: 'desc', ...numericColumn },
];

export const CALL_BY_DEPLOYMENT_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'Deployment', hide: false },
  { field: 'requests', headerName: 'Calls', hide: false, ...numericColumn },
];

export const CALL_BY_PARENT_DEPLOYMENT_COLUMNS: ColDef[] = [
  { field: 'parent_deployment', headerName: 'Parent Deployment', hide: false },
  { field: 'name', headerName: 'Deployment', hide: false },
  { field: 'requests', headerName: 'Calls', hide: false, ...numericColumn },
];

export const CALL_BY_PROJECT_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'Project', hide: false },
  { field: 'requests', headerName: 'Calls', hide: false, ...numericColumn },
];

export const CALL_BY_ROUTES_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'Deployment', hide: false },
  { field: 'route_path', headerName: 'Route', hide: false },
  { field: 'http_method', headerName: 'Method', hide: false },
  { field: 'requests', headerName: 'Calls', hide: false, ...numericColumn },
];

export const SOURCE_CONTAINERS_COLUMNS: ColDef[] = [
  DISPLAY_NAME_COLUMN_WITH_SORT,
  DESCRIPTION_COLUMN,
  NAME_COLUMN,
  {
    headerName: 'Image',
    field: 'source',
    hide: false,
    valueFormatter: ({ data }) => containerSourceNameLabel(data?.source),
    tooltipValueGetter: ({ data }) => containerSourceNameLabel(data?.source),
    filterValueGetter: (params) => containerSourceNameLabel(params.data?.source),
  },
];

export const CONTAINERS_COLUMNS = (t: (key: string) => string, type: string, route: ApplicationRoute): ColDef[] => [
  DISPLAY_NAME_COLUMN,
  DESCRIPTION_COLUMN,
  NAME_COLUMN,
  ...(route === ApplicationRoute.ModelServings
    ? [
        {
          field: '$type',
          headerName: 'Source type',
          hide: false,
          valueFormatter: ({ value }) => t(MODEL_TYPES[value as MODEL_TYPE]),
          tooltipValueGetter: ({ value }) => t(MODEL_TYPES[value as MODEL_TYPE]),
          filterValueGetter: (params) => t(MODEL_TYPES[params.data[params.colDef.field || ''] as MODEL_TYPE]),
        } as ColDef,
      ]
    : [
        {
          headerName: 'Source type',
          field: 'source.$type',
          hide: false,
          valueFormatter: ({ data }) => containerSourceTypeLabel(data?.source, t, type),
          tooltipValueGetter: ({ data }) => containerSourceTypeLabel(data?.source, t, type),
          filterValueGetter: (params) => containerSourceTypeLabel(params.data?.source, t, type),
        } as ColDef,
        {
          headerName: 'Source Name',
          field: 'source',
          hide: false,
          valueFormatter: ({ data }) => containerSourceNameLabel(data?.source),
          tooltipValueGetter: ({ data }) => containerSourceNameLabel(data?.source),
          filterValueGetter: (params) => containerSourceNameLabel(params.data?.source),
        } as ColDef,
      ]),
  {
    ...BASE_STATUS_COLUMN,
    cellRenderer: (params: ICellRendererParams) => <StatusIndicator status={params.data.status} />,
    tooltipValueGetter: ({ value }) => t(STATUS_I18N_KEYS[value as CONTAINER_STATUS]),
    filterValueGetter: (params) => t(STATUS_I18N_KEYS[params.data[params.colDef.field || ''] as CONTAINER_STATUS]),
  },
  { field: 'url', headerName: 'Container URL', hide: true },
  {
    field: 'resources.requests.cpu',
    headerName: t(EntityFieldsI18nKey.CPURequest),
    hide: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    valueGetter: (params: ValueGetterParams) => getCpuColumnValue(params.data?.resources?.requests?.cpu),
    valueFormatter: ({ value }) => formatCpuColumnValue(value as number | null),
    filterValueGetter: (params) => formatCpuColumnValue(getCpuColumnValue(params.data?.resources?.requests?.cpu)),
  },
  {
    field: 'resources.limits.cpu',
    headerName: t(EntityFieldsI18nKey.CPULimit),
    hide: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    valueGetter: (params: ValueGetterParams) => getCpuColumnValue(params.data?.resources?.limits?.cpu),
    valueFormatter: ({ value }) => formatCpuColumnValue(value as number | null),
    filterValueGetter: (params) => formatCpuColumnValue(getCpuColumnValue(params.data?.resources?.limits?.cpu)),
  },
  {
    field: 'resources.requests.memory',
    headerName: t(EntityFieldsI18nKey.MemoryRequest),
    hide: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    valueGetter: (params: ValueGetterParams) => getMemoryColumnValue(params.data?.resources?.requests?.memory),
    valueFormatter: ({ value }) => formatMemoryColumnValue(value as number | null),
    filterValueGetter: (params) =>
      formatMemoryColumnValue(getMemoryColumnValue(params.data?.resources?.requests?.memory)),
  },
  {
    field: 'resources.limits.memory',
    headerName: t(EntityFieldsI18nKey.MemoryLimit),
    hide: true,
    sortable: true,
    filter: 'agTextColumnFilter',
    valueGetter: (params: ValueGetterParams) => getMemoryColumnValue(params.data?.resources?.limits?.memory),
    valueFormatter: ({ value }) => formatMemoryColumnValue(value as number | null),
    filterValueGetter: (params) =>
      formatMemoryColumnValue(getMemoryColumnValue(params.data?.resources?.limits?.memory)),
  },
  ...(route === ApplicationRoute.ModelServings
    ? [
        {
          field: 'resources.gpu',
          headerName: t(EntityFieldsI18nKey.GPURequest),
          hide: true,
          sortable: true,
          filter: 'agTextColumnFilter',
          valueGetter: (params: ValueGetterParams) =>
            getGpuColumnValue(params.data?.resources?.requests?.['nvidia.com/gpu']),
          valueFormatter: ({ value }) => formatGpuColumnValue(value as number | null),
          filterValueGetter: (params) =>
            formatGpuColumnValue(getGpuColumnValue(params.data?.resources?.requests?.['nvidia.com/gpu'])),
        } as ColDef,
      ]
    : []),
  AUTHOR_COLUMN,
  TOPICS_COLUMN,
  { ...CREATED_AT_COLUMN, filter: false },
  { ...UPDATED_AT_COLUMN, filter: false },
];

export const CONTAINER_EVENTS = (t: (key: string, options?: Record<string, string | number>) => string): ColDef[] => [
  {
    field: 'eventType',
    headerName: 'Type',
    hide: false,
    cellRenderer: (params: ICellRendererParams) => <StatusIndicator status={params.data.eventType} />,
    tooltipValueGetter: ({ value }) => t(EVENT_TYPES[value as KubEventType]),
    filterValueGetter: (params) => t(EVENT_TYPES[params.data[params.colDef.field || ''] as KubEventType]),
    maxWidth: 150,
  },
  { field: 'message', headerName: 'Message', hide: false },
  {
    field: 'firstTimestamp',
    headerName: 'Time',
    hide: false,
    ...dateTimeColumn,
    maxWidth: 200,
  },
  {
    field: 'involvedObjectName',
    headerName: 'Pod',
    hide: true,
    valueFormatter: (params) => (params.data.involvedObjectKind === POD_OBJECT_KIND ? params.value : ''),
    filterValueGetter: (params) =>
      params.data.involvedObjectKind === POD_OBJECT_KIND ? params.data[params.colDef.field || ''] : '',
    tooltipValueGetter: (params) => (params.data.involvedObjectKind === POD_OBJECT_KIND ? params.value : ''),
  },
];

export const IMAGES_LIST_FOR_CONTAINER_COLUMNS = (
  onChange: (id: string) => void,
  showTopicsColumn?: boolean,
): ColDef[] => {
  return [
    { field: 'name', headerName: 'Name', hide: false },
    {
      field: 'versions',
      headerName: 'Version',
      hide: false,
      maxWidth: 150,
      minWidth: 150,
      cellRenderer: (params: ICellRendererParams) => {
        return (
          <div className="w-full">
            <VersionsSelect
              selected={params.data.selectedId}
              versions={params.data.availableVersions}
              onChange={onChange}
            />
          </div>
        );
      },
      filterValueGetter: (params) => {
        return params.data.availableVersions.map((v: ImageVersion) => v.version);
      },
    },
    {
      ...DESCRIPTION_COLUMN,
      valueGetter: (params) =>
        params.data.availableVersions.find((v: ImageVersion) => v.id === params.data.selectedId).description,
    },
    { field: 'selectedId', headerName: 'ID', hide: false },
    ...(showTopicsColumn
      ? [
          {
            ...TOPICS_COLUMN,
            cellRenderer: (params: ICellRendererParams) => (
              <TagsCellRenderer
                items={
                  params.data.availableVersions.find((v: ImageVersion) => v.id === params.data.selectedId).topics || []
                }
              />
            ),
            tooltipValueGetter: ({ value }) => (value?.length ? value.join(', ') : null),
            filterValueGetter: (params) =>
              params.data[params.colDef.field || ''].length ? params.data[params.colDef.field || ''].join(' ') : '',
          } as ColDef,
        ]
      : []),
  ];
};

export const IMAGE_TYPE_COLUMN = (t: (key: string) => string): ColDef => ({
  field: '$type',
  headerName: 'Type',
  valueFormatter: ({ value }) => t(IMAGE_TYPE_I18N_KEYS[value as IMAGE_TYPE]) || value,
  tooltipValueGetter: ({ value }) => t(IMAGE_TYPE_I18N_KEYS[value as IMAGE_TYPE]) || value,
  filterValueGetter: (params) => {
    const value = params.data[params.colDef.field || ''];
    return t(IMAGE_TYPE_I18N_KEYS[value as IMAGE_TYPE]) || value;
  },
});

export const IMAGES_LIST_COLUMNS = (t: (key: string) => string): ColDef[] => [
  { field: 'name', headerName: 'Name', hide: false },
  { field: 'version', headerName: 'Version', hide: false },
  DESCRIPTION_COLUMN,
  { field: 'id', headerName: 'ID', hide: false },
  IMAGE_TYPE_COLUMN(t),
  {
    field: 'source.$type',
    headerName: 'Source',
    hide: true,
    valueFormatter: ({ data, value }) =>
      data?.source?.externalRegistryRef
        ? t(SourceI18nKey.McpRegistry)
        : t(IMAGE_SOURCE_TYPE_I18N_KEYS[value as IMAGE_SOURCE_TYPE]) || value,
    tooltipValueGetter: ({ data, value }) =>
      data?.source?.externalRegistryRef
        ? t(SourceI18nKey.McpRegistry)
        : t(IMAGE_SOURCE_TYPE_I18N_KEYS[value as IMAGE_SOURCE_TYPE]) || value,
    filterValueGetter: (params) => {
      const source = params.data.source;
      return source?.externalRegistryRef
        ? t(SourceI18nKey.McpRegistry)
        : t(IMAGE_SOURCE_TYPE_I18N_KEYS[source?.$type as IMAGE_SOURCE_TYPE]) || source?.$type;
    },
  },
  {
    field: 'transportType',
    headerName: 'Transport type',
    hide: true,
    valueFormatter: ({ value }) => t(IMAGE_TRANSPORT_I18N_KEYS[value as IMAGE_TRANSPORT_TYPE]) || value,
    tooltipValueGetter: ({ value }) => t(IMAGE_TRANSPORT_I18N_KEYS[value as IMAGE_TRANSPORT_TYPE]) || value,
    filterValueGetter: (params) => {
      const value = params.data[params.colDef.field || ''];
      return t(IMAGE_TRANSPORT_I18N_KEYS[value as IMAGE_TRANSPORT_TYPE]) || value;
    },
  },
  {
    field: 'buildStatus',
    headerName: 'Status',
    hide: false,
    cellRenderer: (params: ICellRendererParams) => <StatusIndicator status={params.data?.buildStatus} />,
    tooltipValueGetter: ({ value }) => t(STATUS_I18N_KEYS[value as IMAGE_STATUS]),
    filterValueGetter: (params) => t(STATUS_I18N_KEYS[params.data[params.colDef.field || ''] as IMAGE_STATUS]),
  },
  AUTHOR_COLUMN,
  TOPICS_COLUMN,
  { ...CREATED_AT_COLUMN, filter: false },
  { ...UPDATED_AT_COLUMN, filter: false },
];

export const IMAGE_DEPENDENCIES_COLUMNS = (t: (key: string) => string, showImageColumn?: boolean): ColDef[] => [
  { field: 'displayName', headerName: 'Name', hide: false },
  DESCRIPTION_COLUMN,
  { field: 'name', headerName: 'ID', hide: false },
  ...(showImageColumn
    ? [
        {
          headerName: `Image`,
          hide: false,
          valueGetter: (params: ValueGetterParams) =>
            params.data?.source?.$type === 'internal_image' ? params.data.source.imageDefinitionId : undefined,
          cellRenderer: (params: ICellRendererParams) => formatDeploymentImageName(params.data) ?? params.value,
          tooltipValueGetter: (params: ITooltipParams) => formatDeploymentImageName(params.data) ?? params.value,
          filterValueGetter: (params: ValueGetterParams) =>
            formatDeploymentImageName(params.data) ??
            (params.data?.source?.$type === 'internal_image' ? params.data.source.imageDefinitionId : ''),
        },
      ]
    : []),
  {
    ...BASE_STATUS_COLUMN,
    cellRenderer: (params: ICellRendererParams) => <StatusIndicator status={params.data.status} />,
    tooltipValueGetter: ({ value }) => t(STATUS_I18N_KEYS[value as CONTAINER_STATUS]),
    filterValueGetter: (params) => t(STATUS_I18N_KEYS[params.data[params.colDef.field || ''] as CONTAINER_STATUS]),
  },
];

export const TEST_SUITES_COLUMN: ColDef[] = [
  {
    field: 'name',
    colId: 'name',
    headerName: 'Display Name',
    hide: false,
    ...evalStringFilter([GridFilterType.EQUALS, GridFilterType.NOT_EQUAL, GridFilterType.CONTAINS]),
  },
  { ...DESCRIPTION_COLUMN, sortable: false, ...evalStringFilter([GridFilterType.CONTAINS]) },
  { field: 'id', colId: 'id', headerName: 'ID', hide: false, ...evalStringFilter([GridFilterType.EQUALS]) },
  {
    field: 'suiteType',
    colId: 'suiteType',
    headerName: 'Suite Type',
    sortable: false,
    hide: false,
    ...evalStringFilter([GridFilterType.EQUALS]),
  },
  {
    field: 'application',
    headerName: 'Application',
    hide: false,
    sortable: false,
    filter: false,
    valueGetter: (params) => params.data?.deploymentRef?.name || params.data?.mcpDeploymentRef?.name || '',
  },
  { ...CREATED_AT_COLUMN, ...dateFilter },
  { ...UPDATED_AT_COLUMN, ...dateFilter },
  {
    field: 'createdBy',
    headerName: 'Created By',
    hide: false,
    ...evalStringFilter([GridFilterType.EQUALS, GridFilterType.NOT_EQUAL]),
  },
  {
    field: 'method',
    headerName: 'Method',
    sortable: false,
    hide: true,
    filter: false,
    valueGetter: (params) => params.data?.endpointRef?.method || '',
  },
  {
    field: 'url',
    headerName: 'URL',
    sortable: false,
    hide: true,
    filter: false,
    valueGetter: (params) => params.data?.endpointRef?.relativeUrlPattern || '',
  },
];

export const TEST_CASES_COLUMN: ColDef[] = [
  { field: 'id', colId: 'id', headerName: 'ID' },
  { field: 'testCaseName', colId: 'testCaseName', headerName: 'Test case name' },
];

export const DATASETS_COLUMN: ColDef[] = [
  {
    field: 'name',
    colId: 'name',
    headerName: 'Display Name',
    hide: false,
    ...evalStringFilter([GridFilterType.EQUALS, GridFilterType.NOT_EQUAL, GridFilterType.CONTAINS]),
  },
  { ...DESCRIPTION_COLUMN, sortable: false, ...evalStringFilter([GridFilterType.CONTAINS]) },
  { ...CREATED_AT_COLUMN, ...dateFilter },
  { ...UPDATED_AT_COLUMN, ...dateFilter },
];

export const RUNS_COLUMN: ColDef[] = [
  {
    field: 'id',
    colId: 'id',
    headerName: 'ID',
    ...evalStringFilter([GridFilterType.EQUALS]),
    hide: false,
  },
  {
    field: 'testSuiteId',
    colId: 'testSuiteId',
    headerName: 'Test Suite ID',
    ...evalStringFilter([GridFilterType.EQUALS]),
    hide: true,
  },
  {
    field: 'testRunName',
    colId: 'testRunName',
    headerName: 'Test run name',
    ...evalStringFilter([GridFilterType.EQUALS, GridFilterType.NOT_EQUAL, GridFilterType.CONTAINS]),
    hide: false,
  },
  {
    field: 'runConfig.numberOfRuns',
    colId: 'runConfig.numberOfRuns',
    headerName: 'Number of runs',
    filter: false,
    sortable: false,
    hide: false,
  },
  {
    field: 'numberOfTestCases',
    colId: 'numberOfTestCases',
    headerName: 'Number of test cases',
    filter: false,
    sortable: false,
    hide: false,
  },
  { field: 'createdAt', headerName: 'Created date', ...dateTimeColumn, ...dateFilter, hide: true },
  { field: 'startedAt', headerName: 'Start date', ...dateTimeColumn, ...dateFilter, hide: false },
  { field: 'completedAt', headerName: 'End date', ...dateTimeColumn, ...dateFilter, hide: false },
  {
    field: 'status',
    headerName: 'Status',
    cellRenderer: RunStatusCellRenderer,
    tooltipValueGetter: () => undefined,
    ...evalStringFilter([GridFilterType.EQUALS, GridFilterType.NOT_EQUAL]),
    hide: false,
  },
];

export const METRICS_COLUMN: ColDef[] = [
  { field: 'id', colId: 'id', headerName: 'ID', hide: false },
  { field: 'name', colId: 'name', headerName: 'Name', hide: false },
  DESCRIPTION_COLUMN,
  CREATED_AT_COLUMN,
];

export const TOOL_SCHEMA_COLUMNS = (t: (key: string) => string): ColDef[] => [
  { field: 'field', headerName: 'Name', floatingFilter: false, filter: false, sortable: false },
  { field: 'description', headerName: 'Description', floatingFilter: false, filter: false, sortable: false },
  {
    field: 'type',
    headerName: 'Data type',
    floatingFilter: false,
    filter: false,
    sortable: false,
    minWidth: 140,
    maxWidth: 140,
  },
  {
    field: 'required',
    headerName: 'Requirement',
    floatingFilter: false,
    filter: false,
    sortable: false,
    minWidth: 110,
    maxWidth: 110,
    cellDataType: false,
    valueFormatter: ({ value }) => formatRequired(value, t),
    tooltipValueGetter: ({ value }) => formatRequired(value, t),
  },
];

export const PARAMETERS_SCHEMA_COLUMNS = (t: (key: string) => string): ColDef[] => [
  { field: 'name', headerName: 'Name', floatingFilter: false, filter: false, sortable: false },
  { field: 'in', headerName: 'Location', floatingFilter: false, filter: false, sortable: false },
  { field: 'description', headerName: 'Description', floatingFilter: false, filter: false, sortable: false },
  {
    field: 'schema.type',
    headerName: 'Data type',
    floatingFilter: false,
    filter: false,
    sortable: false,
    minWidth: 140,
    maxWidth: 140,
  },
  {
    field: 'required',
    headerName: 'Requirement',
    floatingFilter: false,
    filter: false,
    sortable: false,
    minWidth: 110,
    maxWidth: 110,
    cellDataType: false,
    valueFormatter: ({ value }) => formatRequired(value, t),
    tooltipValueGetter: ({ value }) => formatRequired(value, t),
  },
];

export const HF_REGISTRY_COLUMNS: ColDef[] = [
  { field: 'id', headerName: 'Model name', hide: false, sortable: false },
  {
    field: 'libraries',
    headerName: 'Libraries',
    hide: false,
    cellRenderer: TagsCellRenderer,
    cellRendererParams: (params: { data?: { libraries?: string[] } }) => ({
      items: params.data?.libraries,
    }),
    tooltipValueGetter: ({ value }) => (value?.length ? value.join(', ') : null),
    sortable: false,
    filter: false,
    floatingFilter: false,
  },
  {
    field: 'languages',
    headerName: 'Languages',
    hide: true,
    cellRenderer: TagsCellRenderer,
    cellRendererParams: (params: { data?: { languages?: string[] } }) => ({
      items: params.data?.languages,
    }),
    tooltipValueGetter: ({ value }) => (value?.length ? value.join(', ') : null),
    sortable: false,
    filter: false,
    floatingFilter: false,
  },
  { field: 'author', headerName: 'Author', hide: true, sortable: false },
  {
    field: 'parameters',
    headerName: 'Parameters',
    hide: false,
    cellClass: 'align-right',
    headerClass: 'align-right',
    comparator: numberValueComparator,
    valueFormatter: ({ value }) => (value ? formatNumberWithExponent(value) : ''),
    tooltipValueGetter: ({ value }) => (value ? formatNumberWithExponent(value) : ''),
    filterValueGetter: (params) => formatNumberWithExponent(params.data[params.colDef.field || '']),
    sortable: false,
    filter: false,
    floatingFilter: false,
  },
  {
    field: 'tags',
    headerName: 'Tags',
    hide: true,
    cellRenderer: TagsCellRenderer,
    cellRendererParams: (params: { data?: { tags?: string[] } }) => ({
      items: params.data?.tags,
    }),
    tooltipValueGetter: ({ value }) => (value?.length ? value.join(', ') : null),
    sortable: false,
    filter: false,
    floatingFilter: false,
  },
  {
    field: 'datasets',
    headerName: 'Trained datasets',
    hide: true,
    cellRenderer: TagsCellRenderer,
    cellRendererParams: (params: { data?: { datasets?: string[] } }) => ({
      items: params.data?.datasets,
    }),
    tooltipValueGetter: ({ value }) => (value?.length ? value.join(', ') : null),
    sortable: false,
    filter: false,
    floatingFilter: false,
  },

  {
    field: 'likes',
    headerName: 'Likes',
    hide: false,
    sortingOrder: ['desc', null],
    filter: false,
    floatingFilter: false,
    ...numericColumn,
  },
  {
    field: 'downloads',
    headerName: 'Downloads',
    hide: false,
    sort: 'desc',
    sortingOrder: ['desc', null],
    filter: false,
    floatingFilter: false,
    ...numericColumn,
  },
  {
    ...CREATED_AT_COLUMN,
    hide: true,
    sortingOrder: ['desc', null],
    filter: false,
    floatingFilter: false,
  },
  {
    field: 'lastModified',
    headerName: 'Last modified',
    hide: false,
    sortingOrder: ['desc', null],
    filter: false,
    floatingFilter: false,
    ...dateTimeColumn,
  },
  {
    field: 'licenses',
    headerName: 'Licenses',
    hide: false,
    cellRenderer: TagsCellRenderer,
    cellRendererParams: (params: { data?: { licenses?: string[] } }) => ({
      items: params.data?.licenses,
    }),
    tooltipValueGetter: ({ value }) => (value?.length ? value.join(', ') : null),
    sortable: false,
    filter: false,
    floatingFilter: false,
  },
];

export const MCP_REGISTRY_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'MCP server name', hide: false, sortable: false },
  {
    field: 'websiteUrl',
    headerName: 'Website',
    hide: false,
    sortable: false,
    filter: false,
    floatingFilter: false,
    cellRenderer: ExternalUrlCellRenderer,
  },
  {
    field: 'repository.url',
    headerName: 'Repository',
    hide: false,
    sortable: false,
    filter: false,
    floatingFilter: false,
    valueGetter: (params: ValueGetterParams) => params.data?.repository?.url,
    cellRenderer: ExternalUrlCellRenderer,
  },
  {
    field: 'remotes',
    headerName: 'Remotes',
    hide: false,
    cellRenderer: TagsCellRenderer,
    cellRendererParams: (params: { data?: { remotes?: { type: string }[] } }) => ({
      items: params.data?.remotes?.map((r) => r.type),
    }),
    tooltipValueGetter: ({ value }) =>
      Array.isArray(value) ? value.map((r: { type: string }) => r.type).join(', ') : null,
    sortable: false,
    filter: false,
    floatingFilter: false,
  },
  {
    field: 'packages',
    headerName: 'Packages',
    hide: false,
    cellRenderer: TagsCellRenderer,
    cellRendererParams: (params: { data?: { packages?: { registryType: string }[] } }) => ({
      items: params.data?.packages?.map((p) => p.registryType),
    }),
    tooltipValueGetter: ({ value }) =>
      Array.isArray(value) ? value.map((p: { registryType: string }) => p.registryType).join(', ') : null,
    sortable: false,
    filter: false,
    floatingFilter: false,
  },
  {
    field: 'version',
    headerName: 'Version',
    hide: false,
    sortable: false,
    filter: false,
    floatingFilter: false,
  },
  {
    field: 'updatedAt',
    headerName: 'Last Update',
    hide: false,
    sortable: false,
    filter: false,
    floatingFilter: false,
    ...dateTimeColumn,
  },
];

export const getParamsColumns = (
  onChange: (value: string, data: TestSuiteRequestTemplateParam, key: string, rowIndex?: number) => void,
) => {
  const cols: ColDef[] = [
    {
      headerName: 'Key',
      field: 'key',
      cellClass: NO_BORDER_CLASS,
      tooltipValueGetter: () => undefined,
      cellRenderer: EditableCellRenderer,
      cellRendererParams: {
        onChange,
        hideTriangle: true,
      },
    },
    {
      headerName: 'Value',
      field: 'value',
      cellClass: NO_BORDER_CLASS,
      tooltipValueGetter: () => undefined,
      cellRenderer: EditableCellRenderer,
      cellRendererParams: {
        onChange,
        hideTriangle: true,
      },
    },
  ];

  return cols;
};

export const getFormDataColumns = (
  onChange: (value: string | FormDataType, data: FormDataPart, key: string, rowIndex?: number) => void,
  id: string,
) => {
  const cols: ColDef[] = [
    {
      headerName: 'Name',
      field: 'name',
      cellClass: NO_BORDER_CLASS,
      tooltipValueGetter: () => undefined,
      cellRenderer: EditableCellRenderer,
      cellRendererParams: {
        onChange,
        hideTriangle: true,
      },
    },
    {
      headerName: 'Type',
      field: 'type',
      cellClass: NO_BORDER_CLASS,
      tooltipValueGetter: () => undefined,
      cellRenderer: SelectCellRenderer,
      cellRendererParams: {
        onChange,
        items: [
          {
            value: FormDataType.Text,
            label: capitalize(FormDataType.Text),
          },
          {
            value: FormDataType.File,
            label: capitalize(FormDataType.File),
          },
        ],
      },
    },
    {
      headerName: 'Value',
      field: 'value',
      cellClass: NO_BORDER_CLASS,
      tooltipValueGetter: () => undefined,
      cellRendererSelector: (params: ICellRendererParams<FormDataPart>) => {
        if (params.data?.type === FormDataType.File) {
          return {
            component: FileSelectCellRenderer,
            params: {
              onChange: onChange,
              id: id,
              view: ApplicationRoute.TestSuites,
            },
          };
        }
        return {
          component: EditableCellRenderer,
          params: {
            onChange: onChange,
          },
        };
      },
      cellRendererParams: {
        onChange,
        hideTriangle: true,
      },
    },
  ];

  return cols;
};

export const DOMAIN_COLUMN: ColDef = {
  field: 'domain',
  headerName: 'Domain',
  flex: 1,
  filter: false,
  floatingFilter: false,
  sortable: false,
  cellRenderer: (params: ICellRendererParams) => {
    if (!params.value) return null;
    return (
      <span className="flex items-center gap-2">
        <span className="text-secondary">
          <Cloud {...BASE_BUTTON_ICON_PROPS} />
        </span>
        {params.value}
      </span>
    );
  },
};

const getImportValidationStateLabel = (data: unknown, t: (str: string) => string): string => {
  const meta = (data as Record<string, unknown> | null | undefined)?.[ROW_IMPORT_META_KEY] as RowImportMeta | undefined;
  if (!meta) return '';
  return meta.validationState === ValidationState.FAILED ? t(BasicI18nKey.Failed) : t(BasicI18nKey.Validated);
};

export const IMPORT_VALIDATION_COLUMN = (t: (str: string) => string): ColDef => ({
  field: ROW_IMPORT_META_KEY,
  headerName: t(ImportI18nKey.State),
  cellRenderer: ImportValidationCellRenderer,
  sortable: false,
  tooltipValueGetter: ({ data }) => getImportValidationStateLabel(data, t),
  filterValueGetter: ({ data }) => getImportValidationStateLabel(data, t),
});

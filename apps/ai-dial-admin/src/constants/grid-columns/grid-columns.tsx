'use client';

import { SelectVariant } from '@epam/ai-dial-ui-kit';
import { ColDef, ICellRendererParams, ITooltipParams, ValueGetterParams } from 'ag-grid-community';

import { ACTION_COLUMN, NO_BORDER_CLASS } from '@/src/constants/ag-grid';
import { EVENT_TYPES, MODEL_TYPES, POD_OBJECT_KIND } from '@/src/constants/deployments/containers';
import {
  IMAGE_SOURCE_TYPE_I18N_KEYS,
  IMAGE_TRANSPORT_I18N_KEYS,
  IMAGE_TYPE_I18N_KEYS,
  STATUS_I18N_KEYS,
} from '@/src/constants/deployments/images';
import { formatRequired, getFormattedResourceType } from '@/src/constants/grid-columns/formatters';
import { ImageVersion } from '@/src/models/deployments/images';
import { DialPrompt } from '@/src/models/dial/prompt';
import { Publication } from '@/src/models/dial/publications';
import { CONTAINER_STATUS, KubEventType, MODEL_TYPE } from '@/src/types/deployments/containers';
import { IMAGE_SOURCE_TYPE, IMAGE_STATUS, IMAGE_TRANSPORT_TYPE, IMAGE_TYPE } from '@/src/types/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';
import { formatDeploymentImageName } from '@/src/utils/formatting/deployments';
import { isAssetWithVersion } from '@/src/utils/is-asset-view';
import { getDeleteOperation, getDuplicateOperation, getMoveOperation, getOpenInNewTabOperation } from './actions';

import StatusIndicator from '@/src/components/Deployments/Common/StatusIndicator/StatusIndicator';
import VersionsSelect from '@/src/components/Deployments/Common/VersionsSelect/VersionsSelect';
import EditableCellRenderer from '@/src/components/Grid/CellRenderers/EditableCellRenderer';
import SelectCellRenderer from '@/src/components/Grid/CellRenderers/SelectCellRenderer';
import TagsCellRenderer from '@/src/components/Grid/CellRenderers/TagsCellRenderer';
import { numberValueComparator } from '@/src/components/Grid/comparators/number-comparator';
import { TestSuiteRequestTemplateParam } from '@/src/models/evaluation/test-suite';
import { formatNumberWithExponent } from '@/src/utils/formatting/number-formatting';
import {
  ASSET_NAME_COLUMN,
  ATTACHMENT_COLUMN,
  AUTHOR_COLUMN,
  BASE_STATUS_COLUMN,
  CREATED_AT_COLUMN,
  DESCRIPTION_COLUMN,
  DISPLAY_NAME_COLUMN,
  DISPLAY_NAME_COLUMN_WITH_SORT,
  DISPLAY_VERSION_COLUMN,
  ENDPOINT_COLUMN,
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
import { auditStringFilter, evalStringFilter } from './filters';

export const COLUMN_PANEL_PREFIX = 'column_';

export const BASE_COLUMNS: ColDef[] = [DISPLAY_NAME_COLUMN_WITH_SORT, DESCRIPTION_COLUMN, NAME_COLUMN];

export const BASE_COLUMNS_WITH_TOPICS: ColDef[] = [...BASE_COLUMNS, TOPICS_COLUMN, UPDATED_AT_COLUMN];

export const DEPENDENCIES_COLUMNS = [DISPLAY_NAME_COLUMN, VERSION_COLUMN, DESCRIPTION_COLUMN, NAME_COLUMN];

export const MODELS_COLUMNS = (t: (str: string) => string): ColDef[] => [
  DISPLAY_NAME_COLUMN_WITH_SORT,
  DISPLAY_VERSION_COLUMN,
  DESCRIPTION_COLUMN,
  NAME_COLUMN,
  ...SOURCE_FIELD_COLUMNS(t, ApplicationRoute.Models),
  AUTHOR_COLUMN,
  TOPICS_COLUMN,
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
  ENDPOINT_COLUMN,
  VALIDITY_STATUS_COLUMN(t),
  AUTHOR_COLUMN,
  TOPICS_COLUMN,
  UPDATED_AT_COLUMN,
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
  UPDATED_AT_COLUMN,
];

export const INTERCEPTORS_COLUMNS = (t: (str: string) => string): ColDef[] => [
  DISPLAY_NAME_COLUMN,
  DESCRIPTION_COLUMN,
  NAME_COLUMN_WITH_SORT,
  ...SOURCE_FIELD_COLUMNS(t, ApplicationRoute.Interceptors),
  AUTHOR_COLUMN,
  TOPICS_COLUMN,
  UPDATED_AT_COLUMN,
  BASE_STATUS_COLUMN,
];

export const ROUTES_COLUMNS: ColDef[] = [
  DISPLAY_NAME_COLUMN,
  DESCRIPTION_COLUMN,
  NAME_COLUMN_WITH_SORT,
  PATHS_COLUMN,
  ORDER_COLUMN,
  TOPICS_COLUMN,
  UPDATED_AT_COLUMN,
];

export const EVALUATION_DEPLOYMENTS_COLUMNS = (t: (str: string) => string): ColDef[] => [
  { field: '$type', headerName: 'Type', hide: false },
  DISPLAY_NAME_COLUMN_WITH_SORT,
  VERSION_COLUMN,
  DESCRIPTION_COLUMN,
  { field: 'deploymentId', headerName: 'ID', hide: false },
  ENDPOINT_COLUMN,
  { field: 'owner', headerName: 'Owner', hide: false },
  TOPICS_COLUMN,
  ATTACHMENT_COLUMN(t),
  MAX_INPUT_ATTACHMENTS_COLUMN,
];

export const ACTIVITY_AUDIT_COLUMNS = (t: (s: string) => string, isSingleEntity?: boolean): ColDef[] => {
  const columns: ColDef[] = [
    { field: 'activityType', headerName: 'Activity type', ...auditStringFilter },
    {
      field: 'resourceType',
      headerName: 'Resource type',
      valueFormatter: ({ value }) => getFormattedResourceType(value, t),
      tooltipValueGetter: ({ value }) => getFormattedResourceType(value, t),
      filterValueGetter: (params) => getFormattedResourceType(params.data[params.colDef.field || ''], t),
      ...auditStringFilter,
    },
    { field: 'resourceId', headerName: 'Resource identifier', ...auditStringFilter },
    {
      field: 'epochTimestampMs',
      headerName: 'Time',
      sort: 'desc',
      ...dateTimeColumn,
      floatingFilter: false,
      filter: false,
    },
    { field: 'initiatedEmail', headerName: 'Initiated', ...auditStringFilter },
    { field: 'activityId', headerName: 'Activity ID', ...auditStringFilter },
  ];

  if (isSingleEntity) {
    return [columns[0], ...columns.slice(3)];
  }

  return columns;
};

export const BASE_KEYS_COLUMNS: ColDef[] = [
  DISPLAY_NAME_COLUMN,
  DESCRIPTION_COLUMN,
  NAME_COLUMN_WITH_SORT,
  CREATED_AT_COLUMN,
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
  UPDATED_AT_COLUMN,
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

export const LIST_RUNNER_COLUMNS: ColDef[] = [...RUNNERS_COLUMNS, TOPICS_COLUMN, UPDATED_AT_COLUMN];

export const INTERCEPTOR_TEMPLATES_COLUMNS: ColDef[] = [...BASE_COLUMNS, TOPICS_COLUMN, UPDATED_AT_COLUMN];

export const ASSETS_COLUMNS: ColDef[] = [VERSION_COLUMN, AUTHOR_COLUMN, UPDATED_AT_COLUMN];

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
  const columns: ColDef[] = [NAME_COLUMN_WITH_SORT, AUTHOR_COLUMN, UPDATED_AT_COLUMN];

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
  },
];

export const TELEMETRY_GRID_COLUMNS: ColDef[] = [NAME_COLUMN, ...TELEMETRY_COLUMNS];

export const USAGE_LOG_TRACES_COLUMNS: ColDef[] = [
  { field: 'completion_time', headerName: 'Completion Time', hide: false, ...dateTimeColumn },
  { field: 'trace_id', headerName: 'Trace ID', hide: false },
  { field: 'topic', headerName: 'Topic', hide: false },
  { field: 'reactions', headerName: 'Reactions', hide: true }, // TODO: not implemented
  {
    field: 'cached_prompt_tokens',
    headerName: 'Cached Prompt Tokens',
    hide: true,
    ...numericColumn,
  },
  {
    field: 'prompt_tokens',
    headerName: 'Prompt Tokens',
    hide: false,
    ...numericColumn,
  },
  {
    field: 'completion_tokens',
    headerName: 'Completion Tokens',
    hide: false,
    ...numericColumn,
  },
  {
    field: 'deployment_price',
    headerName: 'Deployment Price',
    minWidth: 180,
    hide: false,
    ...priceColumn('Deployment Price'),
  },
  {
    field: 'price',
    headerName: 'Total Price',
    hide: false,
    ...priceColumn('Total Price'),
  },
  {
    field: 'number_request_messages',
    headerName: 'Number of Request Messages',
    hide: true,
    ...numericColumn,
  },
  { field: 'deployment', headerName: 'Deployment ID', hide: false },
  { field: 'parent_deployment', headerName: 'Parent Deployment ID', hide: true },
  { field: 'model', headerName: 'Model', hide: true },
  { field: 'project_id', headerName: 'Project', hide: false },
  { field: 'upstream', headerName: 'Upstream', hide: true },
  { field: 'execution_path', headerName: 'Execution Path', hide: true },
  { field: 'user_hash', headerName: 'User', hide: false },
  { field: 'user_title', headerName: 'User Title', hide: true },
  { field: 'language', headerName: 'Language', hide: true },
  { field: 'duration', headerName: 'Duration', hide: true },
  { field: 'response_id', headerName: 'Response ID', hide: true },
  { field: 'chat_id', headerName: 'Conversation ID', hide: true },
  { field: 'core_span_id', headerName: 'Core span ID', hide: true },
  { field: 'core_parent_span_id', headerName: 'Core parent span ID', hide: false },
];

export const USAGE_LOG_CONVERSATIONS_COLUMNS: ColDef[] = [
  { field: 'completion_time', headerName: 'Last activity', hide: false, ...dateTimeColumn },
  { field: 'chat_id', headerName: 'Conversation ID', hide: false },
  { field: 'topic', headerName: 'Topic', hide: false },
  {
    field: 'cached_prompt_tokens',
    headerName: 'Cached Prompt Tokens',
    hide: true,
    ...numericColumn,
  },
  {
    field: 'prompt_tokens',
    headerName: 'Prompt Tokens',
    hide: false,
    ...numericColumn,
  },
  {
    field: 'completion_tokens',
    headerName: 'Completion Tokens',
    hide: false,
    ...numericColumn,
  },
  {
    field: 'deployment_price',
    headerName: 'Total Price',
    hide: false,
    ...priceColumn('Total Price'),
  },
  {
    field: 'number_request_messages',
    headerName: 'Number of Request Messages',
    hide: true,
    ...numericColumn,
  },

  { field: 'deployment', headerName: 'Deployment ID', hide: false },
  { field: 'project_id', headerName: 'Project', hide: false },
  { field: 'user_hash', headerName: 'User', hide: false },
  { field: 'user_title', headerName: 'User Title', hide: true },
  { field: 'language', headerName: 'Language', hide: true },
];

export const PROJECT_GRID_COLUMNS: ColDef[] = [{ field: 'name', headerName: 'Project' }, ...TELEMETRY_COLUMNS];

export const SOURCE_CONTAINERS_COLUMNS: ColDef[] = [
  NAME_COLUMN_WITH_SORT,
  DESCRIPTION_COLUMN,
  { field: 'image', headerName: 'Image' },
];

export const CONTAINERS_COLUMNS = (t: (key: string) => string, type: string, route: ApplicationRoute): ColDef[] => [
  DISPLAY_NAME_COLUMN,
  DESCRIPTION_COLUMN,
  NAME_COLUMN,
  ...(route === ApplicationRoute.ModelServings
    ? [
        {
          field: 'type',
          headerName: 'Source type',
          hide: false,
          valueFormatter: ({ value }) => t(MODEL_TYPES[value as MODEL_TYPE]),
          tooltipValueGetter: ({ value }) => t(MODEL_TYPES[value as MODEL_TYPE]),
          filterValueGetter: (params) => t(MODEL_TYPES[params.data[params.colDef.field || ''] as MODEL_TYPE]),
        } as ColDef,
      ]
    : [
        {
          field: 'imageDefinitionId',
          headerName: `${type} Image`,
          hide: false,
          cellRenderer: (params: ICellRendererParams) => formatDeploymentImageName(params.data) ?? params.value,
          tooltipValueGetter: (params: ITooltipParams) => formatDeploymentImageName(params.data) ?? params.value,
          filterValueGetter: (params: ValueGetterParams) =>
            formatDeploymentImageName(params.data) ?? params.data[params.colDef.field || ''],
        },
      ]),
  {
    ...BASE_STATUS_COLUMN,
    cellRenderer: (params: ICellRendererParams) => <StatusIndicator status={params.data.status} />,
    tooltipValueGetter: ({ value }) => t(STATUS_I18N_KEYS[value as CONTAINER_STATUS]),
    filterValueGetter: (params) => t(STATUS_I18N_KEYS[params.data[params.colDef.field || ''] as CONTAINER_STATUS]),
  },
  { field: 'url', headerName: 'Container URL', hide: true },
  AUTHOR_COLUMN,
  UPDATED_AT_COLUMN,
  CREATED_AT_COLUMN,
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
              variant={SelectVariant.Primary}
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

export const IMAGES_LIST_COLUMNS = (t: (key: string) => string): ColDef[] => [
  { field: 'name', headerName: 'Name', hide: false },
  { field: 'version', headerName: 'Version', hide: false },
  DESCRIPTION_COLUMN,
  { field: 'id', headerName: 'ID', hide: false },
  TOPICS_COLUMN,
  {
    field: '$type',
    headerName: 'Type',
    valueFormatter: ({ value }) => t(IMAGE_TYPE_I18N_KEYS[value as IMAGE_TYPE]) || value,
    tooltipValueGetter: ({ value }) => t(IMAGE_TYPE_I18N_KEYS[value as IMAGE_TYPE]) || value,
    filterValueGetter: (params) => {
      const value = params.data[params.colDef.field || ''];
      return t(IMAGE_TYPE_I18N_KEYS[value as IMAGE_TYPE]) || value;
    },
  },
  {
    field: 'source.$type',
    headerName: 'Source',
    hide: true,
    valueFormatter: ({ value }) => t(IMAGE_SOURCE_TYPE_I18N_KEYS[value as IMAGE_SOURCE_TYPE]) || value,
    tooltipValueGetter: ({ value }) => t(IMAGE_SOURCE_TYPE_I18N_KEYS[value as IMAGE_SOURCE_TYPE]) || value,
    filterValueGetter: (params) => {
      const value = params.data.source.$type;
      return t(IMAGE_SOURCE_TYPE_I18N_KEYS[value as IMAGE_SOURCE_TYPE]) || value;
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
  CREATED_AT_COLUMN,
  UPDATED_AT_COLUMN,
];

export const IMAGE_DEPENDENCIES_COLUMNS = (t: (key: string) => string, showImageColumn?: boolean): ColDef[] => [
  { field: 'displayName', headerName: 'Name', hide: false },
  DESCRIPTION_COLUMN,
  { field: 'name', headerName: 'ID', hide: false },
  ...(showImageColumn
    ? [
        {
          field: 'imageDefinitionId',
          headerName: `Image`,
          hide: false,
          cellRenderer: (params: ICellRendererParams) => formatDeploymentImageName(params.data) ?? params.value,
          tooltipValueGetter: (params: ITooltipParams) => formatDeploymentImageName(params.data) ?? params.value,
          filterValueGetter: (params: ValueGetterParams) =>
            formatDeploymentImageName(params.data) ?? params.data[params.colDef.field || ''],
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
  { field: 'name', colId: 'name', headerName: 'Display Name', hide: false, ...evalStringFilter },
  { ...DESCRIPTION_COLUMN, sortable: false, filter: false },
  { field: 'id', colId: 'id', headerName: 'ID', hide: false, filter: false },
  {
    field: 'application',
    headerName: 'Application',
    hide: false,
    sortable: false,
    filter: false,
    valueGetter: (params) => params.data?.deploymentRef?.name || '',
  },
  CREATED_AT_COLUMN,
  UPDATED_AT_COLUMN,
  { field: 'createdBy', headerName: 'Created By', hide: false, ...evalStringFilter },
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

export const TEST_SUITE_RUNS_COLUMNS: ColDef[] = [
  { field: 'id', colId: 'id', headerName: 'ID' },
  { field: 'testRunName', colId: 'testRunName', headerName: 'Test run name' },
  { field: 'runConfig.numberOfRuns', colId: 'runConfig.numberOfRuns', headerName: 'Number of runs' },
  { field: 'numberOfTestCases', colId: 'numberOfTestCases', headerName: 'Number of test cases' },
  { field: 'failedTestCases', colId: 'failedTestCases', headerName: 'Failed test cases' },
  { field: 'totalCost', colId: 'totalCost', headerName: 'Total cost' },
  { field: 'startedAt', headerName: 'Start date', ...dateTimeColumn },
  { field: 'completedAt', headerName: 'End date', ...dateTimeColumn },
  { field: 'status', headerName: 'Status' },
];

// TODO: update columns
export const RUNS_COLUMN = (): ColDef[] => [
  { field: 'displayName', colId: 'displayName', headerName: 'Display Name', hide: false },
];

export const METRICS_COLUMN: ColDef[] = [
  { field: 'id', colId: 'id', headerName: 'ID', hide: false },
  { field: 'name', colId: 'name', headerName: 'Name', hide: false },
  DESCRIPTION_COLUMN,
  CREATED_AT_COLUMN,
];

export const TOOL_SCHEMA_COLUMNS = (t: (key: string) => string): ColDef[] => [
  { field: 'field', headerName: 'Field', floatingFilter: false, filter: false, sortable: false },
  { field: 'description', headerName: 'Description', floatingFilter: false, filter: false, sortable: false },
  { field: 'type', headerName: 'Type', floatingFilter: false, filter: false, sortable: false },
  {
    field: 'required',
    headerName: 'Required',
    floatingFilter: false,
    filter: false,
    sortable: false,
    cellDataType: false,
    valueFormatter: ({ value }) => formatRequired(value, t),
    tooltipValueGetter: ({ value }) => formatRequired(value, t),
  },
];

export const PARAMETERS_SCHEMA_COLUMNS = (t: (key: string) => string): ColDef[] => [
  { field: 'name', headerName: 'Name', floatingFilter: false, filter: false, sortable: false },
  { field: 'in', headerName: 'In', floatingFilter: false, filter: false, sortable: false },
  { field: 'description', headerName: 'Description', floatingFilter: false, filter: false, sortable: false },
  { field: 'schema.type', headerName: 'Type', floatingFilter: false, filter: false, sortable: false },
  {
    field: 'required',
    headerName: 'Required',
    floatingFilter: false,
    filter: false,
    sortable: false,
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

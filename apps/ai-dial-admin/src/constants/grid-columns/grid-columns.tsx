'use client';

import { SelectVariant } from '@epam/ai-dial-ui-kit';
import { ColDef, ICellRendererParams, ITextFilterParams, ITooltipParams, ValueGetterParams } from 'ag-grid-community';

import { getValidityStatus } from '@/src/components/EntityView/Status/utils';
import { numberValueComparator } from '@/src/components/Grid/comparators/number-comparator';
import { ACTION_COLUMN, NO_BORDER_CLASS } from '@/src/constants/ag-grid';
import { EVENT_TYPES, MODEL_TYPES, POD_OBJECT_KIND } from '@/src/constants/deployments/containers';
import {
  IMAGE_SOURCE_TYPE_I18N_KEYS,
  IMAGE_TRANSPORT_I18N_KEYS,
  IMAGE_TYPE_I18N_KEYS,
  STATUS_I18N_KEYS,
} from '@/src/constants/deployments/images';
import {
  formatAttachment,
  formatRequired,
  getFormattedResourceType,
  getTopics,
  numberValueFormatter,
  priceValueFormatter,
  sourceTypeFormatter,
  sourceValueFormatter,
} from '@/src/constants/grid-columns/formatters';
import { ImageVersion } from '@/src/models/deployments/images';
import { DialPrompt } from '@/src/models/dial/prompt';
import { Publication } from '@/src/models/dial/publications';
import { CONTAINER_STATUS, KubEventType, MODEL_TYPE } from '@/src/types/deployments/containers';
import { IMAGE_SOURCE_TYPE, IMAGE_STATUS, IMAGE_TRANSPORT_TYPE, IMAGE_TYPE } from '@/src/types/deployments/images';
import { GridFilterType } from '@/src/types/grid-filter';
import { ApplicationRoute } from '@/src/types/routes';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { formatDeploymentImageName } from '@/src/utils/formatting/deployments';
import { isAssetWithVersion } from '@/src/utils/is-asset-view';
import { getDeleteOperation, getDuplicateOperation, getMoveOperation, getOpenInNewTabOperation } from './actions';

import StatusIndicator from '@/src/components/Deployments/Common/StatusIndicator/StatusIndicator';
import VersionsSelect from '@/src/components/Deployments/Common/VersionsSelect/VersionsSelect';
import SelectCellRenderer from '@/src/components/Grid/CellRenderers/SelectCellRenderer';
import TagsCellRenderer from '@/src/components/Grid/CellRenderers/TagsCellRenderer';
import ValidityStatusCellRenderer from '@/src/components/Grid/CellRenderers/ValidityStatusCellRenderer';
import HeaderWithHintButton from '@/src/components/Grid/HeaderComponents/HeaderWithHintButton';

const stringFilter: Partial<ColDef> = {
  filterParams: {
    maxNumConditions: 1,
    buttons: ['reset', 'apply'],
    closeOnApply: true,
  } as ITextFilterParams,
};

const auditStringFilter: Partial<ColDef> = {
  filterParams: {
    ...stringFilter.filterParams,
    filterOptions: [
      GridFilterType.CONTAINS,
      GridFilterType.NOT_CONTAINS,
      GridFilterType.EQUALS,
      GridFilterType.NOT_EQUAL,
    ],
  } as ITextFilterParams,
};

const evalStringFilter: Partial<ColDef> = {
  filterParams: {
    ...stringFilter.filterParams,
    filterOptions: [GridFilterType.EQUALS],
  } as ITextFilterParams,
};

const dateTimeColumn: Partial<ColDef> = {
  valueFormatter: ({ value }) => formatDateTimeToLocalString(value),
  tooltipValueGetter: ({ value }) => formatDateTimeToLocalString(value),
  filterValueGetter: (params) => formatDateTimeToLocalString(params.data[params.colDef.field || '']),
};

const numericColumn: Partial<ColDef> = {
  cellClass: 'align-right',
  headerClass: 'align-right',
  comparator: numberValueComparator,
  valueFormatter: ({ value }) => numberValueFormatter(value),
  filterValueGetter: (params) => numberValueFormatter(params.data[params.colDef.field || '']),
};

const priceColumn: Partial<ColDef> = {
  ...numericColumn,
  headerComponentParams: {
    innerHeaderComponent: HeaderWithHintButton,
    innerHeaderComponentParams: {
      hintText:
        'The calculated price is an approximation. Since different models, applications, and configurations may have varying token usage and processing costs, it’s not possible to determine the exact final price in advance. \n' +
        'The estimate gives you a general idea of expected costs, but the actual price may differ depending on how the chat unfolds (e.g., message length, complexity, model type, or additional features used).',
      hintTitle: 'Total Price',
    },
  },
  valueFormatter: ({ value }) => `$${priceValueFormatter(value)}`,
  filterValueGetter: (params) => priceValueFormatter(params.data[params.colDef.field || '']),
};

const CREATED_AT_COLUMN: ColDef = {
  field: 'createdAt',
  headerName: 'Creation time',
  hide: false,
  ...dateTimeColumn,
};

const UPDATED_AT_COLUMN = {
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
export const AUTHOR_COLUMN: ColDef = { field: 'author', colId: 'author', headerName: 'Author', hide: false };
export const DISPLAY_NAME_COLUMN: ColDef = {
  field: 'displayName',
  colId: 'displayName',
  headerName: 'Display Name',
  hide: false,
};
export const DISPLAY_NAME_COLUMN_WITH_SORT: ColDef = { ...DISPLAY_NAME_COLUMN, sort: 'asc' };
export const NAME_COLUMN: ColDef = { field: 'name', colId: 'name', headerName: 'ID', hide: false };
const NAME_COLUMN_WITH_SORT: ColDef = { ...NAME_COLUMN, sort: 'asc' };
export const DISPLAY_VERSION_COLUMN: ColDef = {
  field: 'displayVersion',
  colId: 'displayVersion',
  headerName: 'Version',
  hide: false,
  valueFormatter: (params) => params.value,
};

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

export const VALIDITY_STATUS_COLUMN = (t: (str: string) => string): ColDef => {
  return {
    ...BASE_STATUS_COLUMN,
    cellRenderer: ValidityStatusCellRenderer,
    filterValueGetter: ({ data }) => getValidityStatus(data?.validityState, t).title,
  };
};

const ATTACHMENT_COLUMN = (t: (str: string) => string): ColDef => {
  return {
    field: 'inputAttachmentTypes',
    headerName: 'Attachment types',
    hide: true,
    valueFormatter: ({ value }) => formatAttachment(value, t),
    filterValueGetter: (params) => formatAttachment(params.data[params.colDef.field || ''], t),
    tooltipValueGetter: ({ value }) => formatAttachment(value, t),
  };
};

const SOURCE_TYPE_COLUMN = (t: (key: string) => string, view?: ApplicationRoute): ColDef => ({
  field: 'source.$type',
  headerName: 'Source type',
  hide: false,
  valueFormatter: ({ value }) => sourceTypeFormatter(value, t, view),
  filterValueGetter: (params) =>
    sourceTypeFormatter((params.data as { source: { $type: string } }).source.$type, t, view),
  tooltipValueGetter: ({ value }) => sourceTypeFormatter(value, t, view),
});

const SOURCE_VALUE_COLUMN: ColDef = {
  field: 'endpoint',
  headerName: 'Source',
  hide: false,
  valueFormatter: ({ data, value }) => sourceValueFormatter(data, value) || '',
  filterValueGetter: ({ data, colDef }) => sourceValueFormatter(data, data[colDef.field || '']),
  tooltipValueGetter: ({ data, value }) => sourceValueFormatter(data, value),
};

export const SOURCE_FIELD_COLUMNS = (t: (key: string) => string, view?: ApplicationRoute): ColDef[] => [
  SOURCE_TYPE_COLUMN(t, view),
  SOURCE_VALUE_COLUMN,
];

export const TYPE_COLUMN = (t: (str: string) => string): ColDef => {
  return {
    field: 'type',
    headerName: 'Entity type',
    valueFormatter: (params) => t(params.value),
    filterValueGetter: (params) => t(params.data[params.colDef.field || ''] as string),
    tooltipValueGetter: (params) => t(params.value),
  };
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
};

export const SIMPLE_ENTITY_COLUMNS: ColDef[] = [
  DISPLAY_NAME_COLUMN,
  DESCRIPTION_COLUMN,
  NAME_COLUMN_WITH_SORT,
  UPDATED_AT_COLUMN,
];

export const SIMPLE_ENTITY_COLUMNS_WITH_TOPICS: ColDef[] = [...SIMPLE_ENTITY_COLUMNS, TOPICS_COLUMN];

export const ROUTES_COLUMNS: ColDef[] = [
  DISPLAY_NAME_COLUMN,
  DESCRIPTION_COLUMN,
  NAME_COLUMN_WITH_SORT,
  PATHS_COLUMN,
  ORDER_COLUMN,
  TOPICS_COLUMN,
  UPDATED_AT_COLUMN,
];

export const DEPENDENCIES_COLUMNS = [NAME_COLUMN, DISPLAY_NAME_COLUMN, VERSION_COLUMN, DESCRIPTION_COLUMN];
export const BASE_COLUMNS: ColDef[] = [DISPLAY_NAME_COLUMN_WITH_SORT, DESCRIPTION_COLUMN, NAME_COLUMN];

const MAX_INPUT_ATTACHMENTS_COLUMN: ColDef = {
  field: 'maxInputAttachments',
  headerName: 'Max attachment number',
  hide: true,
};

export const MODELS_COLUMNS = (t: (str: string) => string, view?: ApplicationRoute): ColDef[] => [
  DISPLAY_NAME_COLUMN_WITH_SORT,
  DISPLAY_VERSION_COLUMN,
  DESCRIPTION_COLUMN,
  NAME_COLUMN,
  ...SOURCE_FIELD_COLUMNS(t, view),
  AUTHOR_COLUMN,
  { field: 'type', headerName: 'Type', hide: true },
  { field: 'overrideName', headerName: 'Override Name', hide: true },
  TOPICS_COLUMN,
  UPDATED_AT_COLUMN,
  ATTACHMENT_COLUMN(t),
  MAX_INPUT_ATTACHMENTS_COLUMN,
  { field: 'tokenizerModel', headerName: 'Tokenizer model', hide: true },
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
  { field: 'endpoint', headerName: 'Endpoint', hide: false },
  TOPICS_COLUMN,
  AUTHOR_COLUMN,
  VALIDITY_STATUS_COLUMN(t),
  ATTACHMENT_COLUMN(t),
  MAX_INPUT_ATTACHMENTS_COLUMN,
];

export const EVALUATION_DEPLOYMENTS_COLUMNS = (t: (str: string) => string): ColDef[] => [
  { field: '$type', headerName: 'Type', hide: false },
  DISPLAY_NAME_COLUMN_WITH_SORT,
  VERSION_COLUMN,
  DESCRIPTION_COLUMN,
  { field: 'deploymentId', headerName: 'ID', hide: false },
  { field: 'endpoint', headerName: 'Endpoint', hide: false },
  TOPICS_COLUMN,
  { field: 'owner', headerName: 'Owner', hide: false },
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
  {
    ...CREATED_AT_COLUMN,
    hide: true,
  },
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
  UPDATED_AT_COLUMN,
];

export const RUNNERS_COLUMNS: ColDef[] = [
  { field: 'dial:applicationTypeDisplayName', headerName: 'Display Name', sort: 'asc' },
  DESCRIPTION_COLUMN,
  { field: '$id', headerName: 'ID' },
];

export const LIST_RUNNER_COLUMNS: ColDef[] = [...RUNNERS_COLUMNS, TOPICS_COLUMN, UPDATED_AT_COLUMN];

export const INTERCEPTOR_TEMPLATES_COLUMNS: ColDef[] = [...BASE_COLUMNS, TOPICS_COLUMN, UPDATED_AT_COLUMN];

export const ASSETS_COLUMNS: ColDef[] = [{ field: 'version', headerName: 'Version' }, AUTHOR_COLUMN, UPDATED_AT_COLUMN];

export const DEPLOYMENT_ASSETS_COLUMNS: ColDef[] = [NAME_COLUMN, ...ASSETS_COLUMNS];

export const NON_DEPLOYMENT_ASSETS_COLUMNS: ColDef[] = [
  { field: 'name', colId: 'name', headerName: 'Display Name' },
  ...ASSETS_COLUMNS,
];

export const FILES_COLUMNS: ColDef[] = [
  {
    field: 'name',
    colId: 'name',
    headerName: 'Display Name',
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
    cellClass: 'align-right',
    headerClass: 'align-right',
    comparator: numberValueComparator,
    valueFormatter: ({ value }) => numberValueFormatter(value),
    filterValueGetter: (params) => numberValueFormatter(params.data[params.colDef.field || '']),
  },
  {
    field: 'prompts',
    headerName: 'Prompt Tokens',
    cellClass: 'align-right',
    headerClass: 'align-right',
    comparator: numberValueComparator,
    valueFormatter: ({ value }) => numberValueFormatter(value),
    filterValueGetter: (params) => numberValueFormatter(params.data[params.colDef.field || '']),
  },
  {
    field: 'completions',
    headerName: 'Completion tokens',
    cellClass: 'align-right',
    headerClass: 'align-right',
    comparator: numberValueComparator,
    valueFormatter: ({ value }) => numberValueFormatter(value),
    filterValueGetter: (params) => numberValueFormatter(params.data[params.colDef.field || '']),
  },
  {
    field: 'cost',
    headerName: 'Money',
    sort: 'desc',
    cellClass: 'align-right',
    headerClass: 'align-right',
    comparator: numberValueComparator,
    valueFormatter: ({ value }) => numberValueFormatter(value),
    filterValueGetter: (params) => numberValueFormatter(params.data[params.colDef.field || '']),
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
    ...priceColumn,
  },
  {
    field: 'price',
    headerName: 'Total Price',
    hide: false,
    ...priceColumn,
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
    ...priceColumn,
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
  { field: 'displayName', headerName: 'Display name', hide: false },
  { field: 'description', headerName: 'Description', hide: false },
  { field: 'name', headerName: 'ID', hide: false },
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
  { field: 'author', headerName: 'Maintainer', hide: true },
  CREATED_AT_COLUMN,
  UPDATED_AT_COLUMN,
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
    valueFormatter: ({ value }) => formatDateTimeToLocalString(value),
    tooltipValueGetter: ({ value }) => formatDateTimeToLocalString(value),
    filterValueGetter: (params) => formatDateTimeToLocalString(params.data[params.colDef.field || '']),
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
      field: 'description',
      headerName: 'Description',
      hide: false,
      valueGetter: (params) =>
        params.data.availableVersions.find((v: ImageVersion) => v.id === params.data.selectedId).description,
    },
    { field: 'selectedId', headerName: 'ID', hide: false },
    ...(showTopicsColumn
      ? [
          {
            field: 'topics',
            headerName: 'Topics',
            hide: false,
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
  { field: 'description', headerName: 'Description', hide: false },
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
  { field: 'description', headerName: 'Description', hide: false },
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
    valueGetter: (params) => params.data?.endpointRef?.relativeUrl || '',
  },
];

export const TEST_CASES_COLUMN: ColDef[] = [
  { field: 'name', colId: 'name', headerName: 'Display Name' },
  { field: 'name', colId: 'name', headerName: 'Test case name' },
  { field: 'parameters', colId: 'parameters', headerName: 'Parameters' },
  { field: 'parameters', colId: 'parameters', headerName: 'Parameters' },
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
    sortable: false,
    filter: false,
    floatingFilter: false,
  },
  {
    field: 'languages',
    headerName: 'Languages',
    hide: false,
    cellRenderer: TagsCellRenderer,
    cellRendererParams: (params: { data?: { languages?: string[] } }) => ({
      items: params.data?.languages,
    }),
    sortable: false,
    filter: false,
    floatingFilter: false,
  },
  {
    field: 'licenses',
    headerName: 'Licenses',
    hide: false,
    cellRenderer: TagsCellRenderer,
    cellRendererParams: (params: { data?: { licenses?: string[] } }) => ({
      items: params.data?.licenses,
    }),
    sortable: false,
    filter: false,
    floatingFilter: false,
  },
  { field: 'author', headerName: 'Author', hide: false, sortable: false },
  {
    field: 'parameters',
    headerName: 'Parameters',
    hide: true,
    ...numericColumn,
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
    sortable: false,
    filter: false,
    floatingFilter: false,
  },
];

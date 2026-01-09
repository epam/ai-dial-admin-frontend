import { ColDef, ICellRendererParams, ITextFilterParams, ValueGetterParams, ITooltipParams } from 'ag-grid-community';

import ValidityStatusCellRenderer from '@/src/components/Grid/CellRenderers/ValidityStatusCellRenderer';
import SelectCellRenderer from '@/src/components/Grid/CellRenderers/SelectCellRenderer';
import { numberValueComparator } from '@/src/components/Grid/comparators/number-comparator';
import { ACTION_COLUMN, NO_BORDER_CLASS } from '@/src/constants/ag-grid';
import {
  formatAttachment,
  getFormattedResourceType,
  getTopics,
  numberValueFormatter,
  priceValueFormatter,
  sourceTypeFormatter,
  sourceValueFormatter,
} from '@/src/constants/grid-columns/formatters';
import { DialPrompt } from '@/src/models/dial/prompt';
import { Publication } from '@/src/models/dial/publications';
import { GridFilterType } from '@/src/types/grid-filter';
import { ApplicationRoute } from '@/src/types/routes';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { getDeleteOperation, getDuplicateOperation, getMoveOperation, getOpenInNewTabOperation } from './actions';
import HeaderWithHintButton from '@/src/components/Grid/HeaderComponents/HeaderWithHintButton';
import { getValidityStatus } from '@/src/components/EntityView/Status/utils';
import { isAssetWithVersion } from '@/src/utils/is-asset-view';
import DeploymentStatusIndicator from '@/src/components/Common/DeploymentStatusIndicator/DeploymentStatusIndicator';
import { STATUS_I18N_KEYS, TRANSPORT_TYPES } from '@/src/constants/deployments/images';
import { CONTAINER_STATUS, KubEventType, MODEL_TYPE } from '@/src/types/deployments/containers';
import { EVENT_TYPES, MODEL_TYPES, POD_OBJECT_KIND } from '@/src/constants/deployments/containers';
import { IMAGE_STATUS } from '@/src/types/deployments/images';
import VersionsSelect from '@/src/components/Common/VersionsSelect/VersionsSelect';
import { SelectVariant } from '@epam/ai-dial-ui-kit';
import { ImageVersion } from '@/src/models/deployments/images';
import { formatDeploymentImageName } from '@/src/utils/formatting/deployments';
import TagsCellRenderer from '@/src/components/Grid/CellRenderers/TagsCellRenderer';

const stringFilter: Partial<ColDef> = {
  filterParams: {
    filterOptions: [
      GridFilterType.CONTAINS,
      GridFilterType.NOT_CONTAINS,
      GridFilterType.EQUALS,
      GridFilterType.NOT_EQUAL,
    ],
    maxNumConditions: 1,
    buttons: ['reset', 'apply'],
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
    }, // TODO: Update when source of hints will be defined
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

export const VERSION_COLUMN: ColDef = { field: 'version', colId: 'version', headerName: 'Version' };
export const AUTHOR_COLUMN: ColDef = { field: 'author', colId: 'author', headerName: 'Author', hide: false };
export const DISPLAY_NAME_COLUMN: ColDef = {
  field: 'displayName',
  colId: 'displayName',
  headerName: 'Display Name',
  hide: false,
};
const DISPLAY_NAME_COLUMN_WITH_SORT: ColDef = { ...DISPLAY_NAME_COLUMN, sort: 'asc' };
export const NAME_COLUMN: ColDef = { field: 'name', colId: 'name', headerName: 'ID', hide: false };
const NAME_COLUMN_WITH_SORT: ColDef = { ...NAME_COLUMN, sort: 'asc' };

export const TOPICS_COLUMN: ColDef = {
  field: 'topics',
  colId: 'topics',
  headerName: 'Topics',
  cellRenderer: TagsCellRenderer,
  cellRendererParams: (params: { data?: { topics?: string[]; descriptionKeywords?: string[] } }) => ({
    items: getTopics(params.data),
  }),
  filterValueGetter: (params) => getTopics(params.data),
};

export const INTERCEPTOR_STATUS_COLUMN: ColDef = {
  field: 'status',
  headerName: 'Status',
  hide: false,
};

export const VALIDITY_STATUS_COLUMN = (t: (str: string) => string): ColDef => {
  return {
    headerName: 'Status',
    field: 'status',
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

export const ROUTES_COLUMNS: ColDef[] = [
  DISPLAY_NAME_COLUMN,
  DESCRIPTION_COLUMN,
  NAME_COLUMN_WITH_SORT,
  PATHS_COLUMN,
  ORDER_COLUMN,
  UPDATED_AT_COLUMN,
];

export const ENTITY_BASE_COLUMNS: ColDef[] = [NAME_COLUMN, DISPLAY_NAME_COLUMN_WITH_SORT, DESCRIPTION_COLUMN];
export const DEPENDENCIES_COLUMNS = [NAME_COLUMN, DISPLAY_NAME_COLUMN, VERSION_COLUMN, DESCRIPTION_COLUMN];
export const BASE_COLUMNS: ColDef[] = [DISPLAY_NAME_COLUMN_WITH_SORT, DESCRIPTION_COLUMN, NAME_COLUMN];

export const MODELS_COLUMNS = (t: (str: string) => string, view?: ApplicationRoute): ColDef[] => [
  DISPLAY_NAME_COLUMN_WITH_SORT,
  {
    field: 'displayVersion',
    colId: 'displayVersion',
    headerName: 'Version',
    hide: false,
    valueFormatter: (params) => params.value,
  },
  DESCRIPTION_COLUMN,
  NAME_COLUMN,
  ...SOURCE_FIELD_COLUMNS(t, view),
  AUTHOR_COLUMN,
  { field: 'type', headerName: 'Type', hide: true },
  { field: 'overrideName', headerName: 'Override Name', hide: true },
  TOPICS_COLUMN,
  UPDATED_AT_COLUMN,
  ATTACHMENT_COLUMN(t),
  { field: 'maxInputAttachments', headerName: 'Max attachment number', hide: true },
  { field: 'tokenizerModel', headerName: 'Tokenizer model', hide: true },
  { field: 'forwardAuthToken', headerName: 'Forward auth token', hide: true },
  { field: 'limits.maxTotalTokens', headerName: 'Interaction limit', hide: true },
  { field: 'pricing.prompt', headerName: 'Prompt price', hide: true },
  { field: 'pricing.completion', headerName: 'Completion price', hide: true },
];

export const APPLICATIONS_COLUMNS = (t: (str: string) => string): ColDef[] => [
  ...BASE_COLUMNS,
  { field: 'endpoint', headerName: 'Endpoint', hide: false },
  TOPICS_COLUMN,
  AUTHOR_COLUMN,
  VALIDITY_STATUS_COLUMN(t),
  ATTACHMENT_COLUMN(t),
  { field: 'maxInputAttachments', headerName: 'Max attachment number', hide: true },
  { field: 'forwardAuthToken', headerName: 'Forward auth token', hide: true },
];

export const ACTIVITY_AUDIT_COLUMNS = (t: (s: string) => string, isSingleEntity?: boolean): ColDef[] => {
  const columns: ColDef[] = [
    { field: 'activityType', headerName: 'Activity type', ...stringFilter },
    {
      field: 'resourceType',
      headerName: 'Resource type',
      valueFormatter: ({ value }) => getFormattedResourceType(value, t),
      tooltipValueGetter: ({ value }) => getFormattedResourceType(value, t),
      filterValueGetter: (params) => getFormattedResourceType(params.data[params.colDef.field || ''], t),
      ...stringFilter,
    },
    { field: 'resourceId', headerName: 'Resource identifier', ...stringFilter },
    {
      field: 'epochTimestampMs',
      headerName: 'Time',
      sort: 'desc',
      ...dateTimeColumn,
      floatingFilter: false,
      filter: false,
    },
    { field: 'initiatedEmail', headerName: 'Initiated', ...stringFilter },
    { field: 'activityId', headerName: 'Activity ID', ...stringFilter },
  ];

  if (isSingleEntity) {
    return [columns[0], ...columns.slice(3)];
  }

  return columns;
};

export const KEYS_COLUMNS = (t: (str: string) => string): ColDef[] => [
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
  VALIDITY_STATUS_COLUMN(t),
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

export const INTERCEPTOR_TEMPLATES_COLUMNS: ColDef[] = [...BASE_COLUMNS, UPDATED_AT_COLUMN];

export const ASSETS_COLUMNS: ColDef[] = [{ field: 'version', headerName: 'Version' }, AUTHOR_COLUMN, UPDATED_AT_COLUMN];

export const DEPLOYMENT_ASSETS_COLUMNS: ColDef[] = [NAME_COLUMN, ...ASSETS_COLUMNS];

export const NON_DEPLOYMENT_ASSETS_COLUMNS: ColDef[] = [
  { field: 'name', colId: 'name', headerName: 'Display Name' },
  ...ASSETS_COLUMNS,
];

export const FILES_COLUMNS: ColDef[] = [
  { field: 'name', colId: 'name', headerName: 'Display Name', valueFormatter: ({ value }) => value },
  { field: 'extension', headerName: 'Extension' },
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
  { field: 'completion_time', headerName: 'Completion Time', ...dateTimeColumn },
  { field: 'trace_id', headerName: 'Trace ID' },
  { field: 'topic', headerName: 'Topic' },
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
    ...numericColumn,
  },
  {
    field: 'completion_tokens',
    headerName: 'Completion Tokens',
    ...numericColumn,
  },
  {
    field: 'deployment_price',
    headerName: 'Deployment Price',
    ...priceColumn,
  },
  {
    field: 'price',
    headerName: 'Total Price',
    ...priceColumn,
  },
  {
    field: 'number_request_messages',
    headerName: 'Number of Request Messages',
    hide: true,
    ...numericColumn,
  },
  { field: 'deployment', headerName: 'Deployment ID' },
  { field: 'parent_deployment', headerName: 'Parent Deployment ID', hide: true },
  { field: 'model', headerName: 'Model', hide: true },
  { field: 'project_id', headerName: 'Project' },
  { field: 'upstream', headerName: 'Upstream', hide: true },
  { field: 'execution_path', headerName: 'Execution Path', hide: true },
  { field: 'user_hash', headerName: 'User' },
  { field: 'user_title', headerName: 'User Title', hide: true },
  { field: 'language', headerName: 'Language', hide: true },
  { field: 'duration', headerName: 'Duration', hide: true },
  { field: 'response_id', headerName: 'Response ID', hide: true },
  { field: 'chat_id', headerName: 'Conversation ID', hide: true },
  { field: 'core_span_id', headerName: 'Core span ID', hide: true },
  { field: 'core_parent_span_id', headerName: 'Core parent span ID' },
];

export const USAGE_LOG_CONVERSATIONS_COLUMNS: ColDef[] = [
  { field: 'completion_time', headerName: 'Last activity', ...dateTimeColumn },
  { field: 'chat_id', headerName: 'Conversation ID' },
  { field: 'topic', headerName: 'Topic' },
  {
    field: 'cached_prompt_tokens',
    headerName: 'Cached Prompt Tokens',
    hide: true,
    ...numericColumn,
  },
  {
    field: 'prompt_tokens',
    headerName: 'Prompt Tokens',
    ...numericColumn,
  },
  {
    field: 'completion_tokens',
    headerName: 'Completion Tokens',
    ...numericColumn,
  },
  {
    field: 'deployment_price',
    headerName: 'Total Price',
    ...priceColumn,
  },
  {
    field: 'number_request_messages',
    headerName: 'Number of Request Messages',
    hide: true,
    ...numericColumn,
  },

  { field: 'deployment', headerName: 'Deployment ID' },
  { field: 'project_id', headerName: 'Project' },
  { field: 'user_hash', headerName: 'User' },
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
  { field: 'name', headerName: 'Name', hide: false },
  { field: 'description', headerName: 'Description', hide: false },
  ...(route === ApplicationRoute.ModelDeployments
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
    field: 'status',
    headerName: 'Status',
    hide: false,
    cellRenderer: (params: ICellRendererParams) => <DeploymentStatusIndicator status={params.data.status} />,
    tooltipValueGetter: ({ value }) => t(STATUS_I18N_KEYS[value as CONTAINER_STATUS]),
    filterValueGetter: (params) => t(STATUS_I18N_KEYS[params.data[params.colDef.field || ''] as CONTAINER_STATUS]),
  },
  { field: 'id', headerName: 'ID', hide: true },
  { field: 'url', headerName: 'Container URL', hide: true },
  { field: 'author', headerName: 'Maintainer', hide: true },
  {
    field: 'createdAt',
    headerName: 'Create time',
    hide: true,
    valueFormatter: ({ value }) => formatDateTimeToLocalString(value),
    tooltipValueGetter: ({ value }) => formatDateTimeToLocalString(value),
    filterValueGetter: (params) => formatDateTimeToLocalString(params.data[params.colDef.field || '']),
  },
  {
    field: 'updatedAt',
    headerName: 'Update time',
    hide: false,
    valueFormatter: ({ value }) => formatDateTimeToLocalString(value),
    tooltipValueGetter: ({ value }) => formatDateTimeToLocalString(value),
    filterValueGetter: (params) => formatDateTimeToLocalString(params.data[params.colDef.field || '']),
  },
];

export const CONTAINER_EVENTS = (t: (key: string, options?: Record<string, string | number>) => string): ColDef[] => [
  {
    field: 'eventType',
    headerName: 'Type',
    hide: false,
    cellRenderer: (params: ICellRendererParams) => <DeploymentStatusIndicator status={params.data.eventType} />,
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

export const BASE_IMAGE_LIST_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'Name', hide: false },
  { field: 'version', headerName: 'Version', hide: false },
  { field: 'description', headerName: 'Description', hide: false },
  {
    field: 'topics',
    headerName: 'Topics',
    hide: false,
    cellRenderer: (params: ICellRendererParams) => <TagsCellRenderer items={params.data?.topics || []} />,
    tooltipValueGetter: ({ value }) => (value?.length ? value.join(', ') : null),
    filterValueGetter: (params) =>
      params.data[params.colDef.field || ''].length ? params.data[params.colDef.field || ''].join(' ') : '',
  },
];

export const CHANGE_IMAGE_VERSION = (t: (key: string) => string): ColDef[] => [
  { field: 'name', headerName: 'Name', hide: false },
  { field: 'version', headerName: 'Version', hide: false },
  { field: 'id', headerName: 'ID', hide: false },
  {
    field: 'buildStatus',
    headerName: 'Status',
    hide: false,
    cellRenderer: (params: ICellRendererParams) => <DeploymentStatusIndicator status={params.data?.status} />,
    tooltipValueGetter: ({ value }) => t(STATUS_I18N_KEYS[value as IMAGE_STATUS]),
    filterValueGetter: (params) => t(STATUS_I18N_KEYS[params.data[params.colDef.field || ''] as IMAGE_STATUS]),
  },
];

export const IMAGES_LIST_FOR_CONTAINER_COLUMNS = (onChange: (id: string) => void): ColDef[] => {
  return [
    { field: 'name', headerName: 'Name', hide: false },
    {
      field: 'versions',
      headerName: 'Versions',
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
    },
    {
      field: 'description',
      headerName: 'Description',
      hide: false,
      valueGetter: (params) =>
        params.data.availableVersions.find((v: ImageVersion) => v.id === params.data.selectedId).description,
    },
    {
      field: 'topics',
      headerName: 'Topics',
      hide: false,
      cellRenderer: (params: ICellRendererParams) => (
        <TagsCellRenderer
          items={params.data.availableVersions.find((v: ImageVersion) => v.id === params.data.selectedId).topics || []}
        />
      ),
      tooltipValueGetter: ({ value }) => (value?.length ? value.join(', ') : null),
      filterValueGetter: (params) =>
        params.data[params.colDef.field || ''].length ? params.data[params.colDef.field || ''].join(' ') : '',
    },
  ];
};

export const IMAGES_LIST_COLUMNS = (t: (key: string) => string): ColDef[] => [
  ...BASE_IMAGE_LIST_COLUMNS,
  {
    field: 'buildStatus',
    headerName: 'Status',
    hide: false,
    cellRenderer: (params: ICellRendererParams) => <DeploymentStatusIndicator status={params.data?.buildStatus} />,
    tooltipValueGetter: ({ value }) => t(STATUS_I18N_KEYS[value as IMAGE_STATUS]),
    filterValueGetter: (params) => t(STATUS_I18N_KEYS[params.data[params.colDef.field || ''] as IMAGE_STATUS]),
  },
  {
    field: 'createdAt',
    headerName: 'Create time',
    hide: true,
    valueFormatter: ({ value }) => formatDateTimeToLocalString(value),
    tooltipValueGetter: ({ value }) => formatDateTimeToLocalString(value),
    filterValueGetter: (params) => formatDateTimeToLocalString(params.data[params.colDef.field || '']),
  },
  {
    field: 'updatedAt',
    headerName: 'Update time',
    hide: false,
    valueFormatter: ({ value }) => formatDateTimeToLocalString(value),
    tooltipValueGetter: ({ value }) => formatDateTimeToLocalString(value),
    filterValueGetter: (params) => formatDateTimeToLocalString(params.data[params.colDef.field || '']),
  },
  { field: 'source.$type', headerName: 'Source', hide: true },
  { field: 'license', headerName: 'License', hide: true },
];

export const MCP_IMAGES_LIST_COLUMNS = (t: (key: string) => string): ColDef[] => {
  return [
    ...IMAGES_LIST_COLUMNS(t),
    {
      field: 'transportType',
      headerName: 'Transport type',
      hide: true,
      valueFormatter: ({ value }) => TRANSPORT_TYPES.find((transport) => transport.id === value)?.name || value,
      tooltipValueGetter: ({ value }) => TRANSPORT_TYPES.find((transport) => transport.id === value)?.name || value,
      filterValueGetter: (params) =>
        TRANSPORT_TYPES.find((transport) => transport.id === params.data[params.colDef.field || ''])?.name ||
        params.data[params.colDef.field || ''],
    },
  ];
};

export const IMAGE_DEPENDENCIES_COLUMNS = (t: (key: string) => string): ColDef[] => [
  { field: 'name', headerName: 'Name', hide: false },
  { field: 'description', headerName: 'Description', hide: false },
  { field: 'id', headerName: 'ID', hide: false },
  {
    field: 'status',
    headerName: 'Status',
    hide: false,
    cellRenderer: (params: ICellRendererParams) => <DeploymentStatusIndicator status={params.data.status} />,
    tooltipValueGetter: ({ value }) => t(STATUS_I18N_KEYS[value as IMAGE_STATUS]),
    filterValueGetter: (params) => t(STATUS_I18N_KEYS[params.data[params.colDef.field || ''] as IMAGE_STATUS]),
  },
];

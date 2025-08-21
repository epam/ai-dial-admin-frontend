import { ColDef, ITextFilterParams } from 'ag-grid-community';

import KeyStatusCellRenderer from '@/src/components/Grid/CellRenderers/KeyStatusCellRenderer';
import SelectCellRenderer from '@/src/components/Grid/CellRenderers/SelectCellRenderer';
import TopicsCellRenderer from '@/src/components/Grid/CellRenderers/TopicCellRenderer';
import { numberValueComparator } from '@/src/components/Grid/comparators/number-comparator';
import { ACTION_COLUMN, NO_BORDER_CLASS } from '@/src/constants/ag-grid';
import {
  formatAttachment,
  getFormattedResourceType,
  numberValueFormatter,
  priceValueFormatter,
} from '@/src/constants/grid-columns/formatters';
import { DialBaseNamedEntity } from '@/src/models/dial/base-entity';
import { DialPrompt } from '@/src/models/dial/prompt';
import { Publication } from '@/src/models/dial/publications';
import { GridFilterType } from '@/src/types/grid-filter';
import { ApplicationRoute } from '@/src/types/routes';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { getDeleteOperation, getDuplicateOperation, getMoveOperation, getOpenInNewTabOperation } from './actions';

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
};

const numericColumn: Partial<ColDef> = {
  cellClass: 'align-right',
  headerClass: 'align-right',
  comparator: numberValueComparator,
  valueFormatter: (params) => numberValueFormatter(params),
};

const priceColumn: Partial<ColDef> = {
  ...numericColumn,
  valueFormatter: (params) => `$${priceValueFormatter(params)}`,
};

const CREATED_AT_COLUMN: ColDef = {
  field: 'createdAt',
  headerName: 'Creation time',
  hide: false,
  ...dateTimeColumn,
};

const UPDATED_AT_COLUMN: ColDef = {
  field: 'updateTime',
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
export const AUTHOR_COLUMN: ColDef = { field: 'author', colId: 'author', headerName: 'Author' };
export const DISPLAY_NAME_COLUMN: ColDef = {
  field: 'displayName',
  colId: 'displayName',
  headerName: 'Display Name',
  hide: false,
};
const DISPLAY_NAME_COLUMN_WITH_SORT: ColDef = { ...DISPLAY_NAME_COLUMN, sort: 'asc' };
export const NAME_COLUMN: ColDef = { field: 'name', colId: 'name', headerName: 'ID', hide: false };
const NAME_COLUMN_WITH_SORT: ColDef = { ...NAME_COLUMN, sort: 'asc' };

const TOPIC_COLUMN: ColDef = {
  field: 'topics',
  colId: 'topics',
  headerName: 'Topics',
  cellRenderer: TopicsCellRenderer,
  cellRendererParams: (params: { data?: DialBaseNamedEntity & { topics: string[] } }) => ({
    topics: params.data?.topics || [],
  }),
};

const ATTACHMENT_COLUMN = (t: (str: string) => string): ColDef => {
  return {
    field: 'inputAttachmentTypes',
    headerName: 'Attachment types',
    hide: true,
    valueFormatter: ({ value }) => formatAttachment(value, t),
    tooltipValueGetter: ({ value }) => formatAttachment(value, t),
  };
};

export const TYPE_COLUMN = (t: (str: string) => string): ColDef => {
  return {
    field: 'type',
    headerName: 'Entity type',
    valueFormatter: (params) => t(params.value),
    tooltipValueGetter: (params) => t(params.value),
  };
};

export const SIMPLE_DESCRIPTION_COLUMNS: ColDef[] = [NAME_COLUMN_WITH_SORT, DISPLAY_NAME_COLUMN, DESCRIPTION_COLUMN];
export const SIMPLE_ENTITY_COLUMNS: ColDef[] = [NAME_COLUMN_WITH_SORT, DESCRIPTION_COLUMN];

export const ENTITY_BASE_COLUMNS: ColDef[] = [DISPLAY_NAME_COLUMN_WITH_SORT, DESCRIPTION_COLUMN, NAME_COLUMN];
export const DEPENDENCIES_COLUMNS = [DISPLAY_NAME_COLUMN, VERSION_COLUMN, DESCRIPTION_COLUMN, NAME_COLUMN];

export const MODELS_COLUMNS = (t: (str: string) => string): ColDef[] => [
  DISPLAY_NAME_COLUMN_WITH_SORT,
  { field: 'displayVersion', colId: 'displayVersion', headerName: 'Version', hide: false },
  DESCRIPTION_COLUMN,
  NAME_COLUMN,
  {
    field: 'adapter',
    headerName: 'Adapter',
    hide: false,
  },
  { field: 'type', headerName: 'Type', hide: true },
  { field: 'overrideName', headerName: 'Override Name', hide: true },
  TOPIC_COLUMN,
  ATTACHMENT_COLUMN(t),
  { field: 'maxInputAttachments', headerName: 'Max attachment number', hide: true },
  { field: 'tokenizerModel', headerName: 'Tokenizer model', hide: true },
  { field: 'forwardAuthToken', headerName: 'Forward auth token', hide: true },
  { field: 'limits.maxTotalTokens', headerName: 'Interaction limit', hide: true },
  { field: 'pricing.prompt', headerName: 'Prompt price', hide: true },
  { field: 'pricing.completion', headerName: 'Completion price', hide: true },
];

export const APPLICATIONS_COLUMNS = (t: (str: string) => string): ColDef[] => [
  DISPLAY_NAME_COLUMN_WITH_SORT,
  DESCRIPTION_COLUMN,
  NAME_COLUMN,
  { field: 'endpoint', headerName: 'Endpoint', hide: false },
  TOPIC_COLUMN,
  ATTACHMENT_COLUMN(t),
  { field: 'maxInputAttachments', headerName: 'Max attachment number', hide: true },
  { field: 'forwardAuthToken', headerName: 'Forward auth token', hide: true },
];

export const ACTIVITY_AUDIT_COLUMNS = (isSingleEntity?: boolean): ColDef[] => {
  const columns: ColDef[] = [
    { field: 'activityType', headerName: 'Activity type', ...stringFilter },
    {
      field: 'resourceType',
      headerName: 'Resource type',
      valueFormatter: ({ value }) => getFormattedResourceType(value),
      tooltipValueGetter: ({ value }) => getFormattedResourceType(value),
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

export const KEYS_COLUMNS: ColDef[] = [
  NAME_COLUMN_WITH_SORT,
  DESCRIPTION_COLUMN,
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
  {
    headerName: 'Status',
    field: 'status',
    cellRenderer: KeyStatusCellRenderer,
  },
  {
    headerName: 'Project',
    field: 'project',
    hide: true,
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
  { field: '$id', headerName: 'ID' },
  DESCRIPTION_COLUMN,
  TOPIC_COLUMN,
];

export const INTERCEPTOR_TEMPLATES_COLUMNS: ColDef[] = [DISPLAY_NAME_COLUMN_WITH_SORT, DESCRIPTION_COLUMN, NAME_COLUMN];

export const PROMPTS_COLUMNS: ColDef[] = [
  { field: 'name', colId: 'name', headerName: 'Display Name' },
  { field: 'version', headerName: 'Version' },
  AUTHOR_COLUMN,
  UPDATED_AT_COLUMN,
];

export const FILES_COLUMNS: ColDef[] = [
  { field: 'name', colId: 'name', headerName: 'Display Name' },
  { field: 'extension', headerName: 'Extension' },
  AUTHOR_COLUMN,
];

export const EXPORT_COLUMNS = (onChange: (value: string, name: string) => void, route?: ApplicationRoute): ColDef[] => [
  NAME_COLUMN_WITH_SORT,
  route === ApplicationRoute.Prompts
    ? {
        headerName: 'Version',
        field: 'version',
        sortable: true,
        filter: true,
        cellClass: NO_BORDER_CLASS,
        cellRenderer: SelectCellRenderer,
        cellRendererParams: {
          getItems: (data: DialPrompt) => data.versions?.map((v) => ({ id: v, name: v })),
          onChange,
          isMulti: true,
        },
      }
    : {
        headerName: 'Extension',
        field: 'extension',
      },
  AUTHOR_COLUMN,
  UPDATED_AT_COLUMN,
];

export const PUBLICATION_COLUMNS: ColDef[] = [
  { field: 'requestName', headerName: 'Name' },
  AUTHOR_COLUMN,
  { ...CREATED_AT_COLUMN, sort: 'asc' },
];

export const getPublicationColumns = (open: (publication: Publication) => void): ColDef[] => {
  const actions = [getOpenInNewTabOperation(open)];

  return [...PUBLICATION_COLUMNS, ACTION_COLUMN(actions)];
};

export const ENTITIES_COLUMNS = <T>(
  columns: ColDef[],
  remove?: (entity: T) => void,
  duplicate?: (entity: T) => void,
  open?: (entity: T) => void,
  move?: (entity: T) => void,
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
    valueFormatter: (params) => numberValueFormatter(params),
  },
  {
    field: 'prompts',
    headerName: 'Prompt Tokens',
    cellClass: 'align-right',
    headerClass: 'align-right',
    comparator: numberValueComparator,
    valueFormatter: (params) => numberValueFormatter(params),
  },
  {
    field: 'completions',
    headerName: 'Completion tokens',
    cellClass: 'align-right',
    headerClass: 'align-right',
    comparator: numberValueComparator,
    valueFormatter: (params) => numberValueFormatter(params),
  },
  {
    field: 'cost',
    headerName: 'Money',
    sort: 'desc',
    cellClass: 'align-right',
    headerClass: 'align-right',
    comparator: numberValueComparator,
    valueFormatter: (params) => numberValueFormatter(params),
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
    hide: true,
    ...priceColumn,
  },
  {
    field: 'number_request_messages',
    headerName: 'Number of Request Messages',
    hide: true,
    ...numericColumn,
  },
  {
    field: 'price',
    headerName: 'Total Price',
    ...priceColumn,
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
    headerName: 'Deployment Price',
    hide: true,
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
  { field: 'core_span_id', headerName: 'Core span ID', hide: true },
  { field: 'core_parent_span_id', headerName: 'Core parent span ID' },
];

export const PROJECT_GRID_COLUMNS: ColDef[] = [{ field: 'name', headerName: 'Project' }, ...TELEMETRY_COLUMNS];

export const SOURCE_CONTAINERS_COLUMNS: ColDef[] = [
  NAME_COLUMN_WITH_SORT,
  DESCRIPTION_COLUMN,
  { field: 'image', headerName: 'Interceptor Image' },
];

export const SOURCE_RUNNERS_COLUMNS: ColDef[] = [DISPLAY_NAME_COLUMN_WITH_SORT, NAME_COLUMN, DESCRIPTION_COLUMN];

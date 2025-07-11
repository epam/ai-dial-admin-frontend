import { ColDef, ITextFilterParams } from 'ag-grid-community';

import SelectCellRenderer from '@/src/components/Grid/CellRenderers/SelectCellRenderer';
import TopicsCellRenderer from '@/src/components/Grid/CellRenderers/TopicCellRenderer';
import KeyStatusCellRenderer from '@/src/components/Grid/CellRenderers/KeyStatusCellRenderer';
import { ACTION_COLUMN, NO_BORDER_CLASS } from '@/src/constants/ag-grid';
import {
  formatAttachment,
  getFormattedResourceType,
  numberValueFormatter,
} from '@/src/constants/grid-columns/formatters';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialBaseNamedEntity } from '@/src/models/dial/base-entity';
import { DialPrompt } from '@/src/models/dial/prompt';
import { GridFilterType } from '@/src/types/grid-filter';
import { ApplicationRoute } from '@/src/types/routes';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { getDeleteOperation, getDuplicateOperation, getMoveOperation, getOpenInNewTabOperation } from './actions';
import { Publication } from '@/src/models/dial/publications';
import { numberValueComparator } from '@/src/components/Grid/comparators/number-comparator';

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

export const SIMPLE_VERSION_COLUMNS: ColDef[] = [
  { field: 'displayName', headerName: 'Display Name', sort: 'asc' },
  { field: 'version', headerName: 'Version' },
];

export const SIMPLE_NAME_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'Name', sort: 'asc' },
  { field: 'displayName', headerName: 'Display Name' },
  { field: 'version', headerName: 'Version' },
];

export const SIMPLE_DESCRIPTION_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'Name', sort: 'asc' },
  { field: 'displayName', headerName: 'Display Name' },
  { field: 'description', headerName: 'Description' },
];

export const SIMPLE_ENTITY_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'Name', sort: 'asc' },
  { field: 'description', headerName: 'Description' },
];

export const ENTITY_BASE_COLUMNS: ColDef[] = [
  { field: 'displayName', colId: 'displayName', headerName: 'Display Name', hide: false },
  { field: 'displayVersion', colId: 'displayVersion', headerName: 'Version', hide: false },
  { field: 'description', colId: 'description', headerName: 'Description', hide: false },
  { field: 'name', colId: 'name', headerName: 'Deployment ID', hide: false },
];

export const ENTITY_WITH_VERSION_COLUMNS = (
  t: (stringToTranslate: string) => string,
  adapters: DialAdapter[] = [],
): ColDef[] => [
  ...ENTITY_BASE_COLUMNS,
  adapters.length
    ? {
        field: 'adapter',
        headerName: 'Adapter',
        hide: false,
      }
    : { field: 'endpoint', headerName: 'Endpoint', hide: false },
  { field: 'type', headerName: 'Type', hide: true },
  { field: 'overrideName', headerName: 'Override Name', hide: true },
  {
    field: 'topics',
    headerName: 'Topics',
    hide: true,
    cellRenderer: TopicsCellRenderer,
    cellRendererParams: (params: { data?: DialBaseNamedEntity & { topics: string[] } }) => ({
      topics: params.data?.topics || [],
    }),
  },
  {
    field: 'inputAttachmentTypes',
    headerName: 'Attachment types',
    hide: true,
    valueFormatter: ({ value }) => formatAttachment(value, t),
    tooltipValueGetter: ({ value }) => formatAttachment(value, t),
  },
  { field: 'maxInputAttachments', headerName: 'Max attachment number', hide: true },
  { field: 'tokenizerModel', headerName: 'Tokenizer model', hide: true },
  { field: 'forwardAuthToken', headerName: 'Forward auth token', hide: true },
  { field: 'limits.maxTotalTokens', headerName: 'Interaction limit', hide: true },
  { field: 'pricing.prompt', headerName: 'Prompt price', hide: true },
  { field: 'pricing.completion', headerName: 'Completion price', hide: true },
];

export const ACTIVITY_AUDIT_COLUMNS: ColDef[] = [
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
    valueFormatter: ({ value }) => formatDateTimeToLocalString(value),
    tooltipValueGetter: ({ value }) => formatDateTimeToLocalString(value),
    floatingFilter: false,
    filter: false,
  },
  { field: 'initiatedEmail', headerName: 'Initiated', ...stringFilter },
  { field: 'activityId', headerName: 'Activity ID', ...stringFilter },
];

export const KEY_ENTITY_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'Name', sort: 'asc', hide: false },
  { field: 'description', headerName: 'Description', hide: false },
  {
    field: 'createdAt',
    headerName: 'Creation time',
    valueFormatter: ({ value }) => formatDateTimeToLocalString(value),
    tooltipValueGetter: ({ value }) => formatDateTimeToLocalString(value),
    hide: true,
  },
  {
    field: 'keyGeneratedAt',
    headerName: 'Key generation time',
    valueFormatter: ({ value }) => formatDateTimeToLocalString(value),
    tooltipValueGetter: ({ value }) => formatDateTimeToLocalString(value),
    hide: false,
  },
  {
    field: 'expiresAt',
    headerName: 'Expiration time',
    valueFormatter: ({ value }) => formatDateTimeToLocalString(value),
    tooltipValueGetter: ({ value }) => formatDateTimeToLocalString(value),
    hide: false,
  },
  {
    headerName: 'Status',
    field: 'status',
    cellRenderer: KeyStatusCellRenderer,
    hide: false,
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
  { field: 'description', headerName: 'Description' },
  {
    field: 'topics',
    headerName: 'Topics',
    cellRenderer: TopicsCellRenderer,
    cellRendererParams: (params: { data?: DialBaseNamedEntity & { topics: string[] } }) => ({
      topics: params.data?.topics || [],
    }),
  },
];

export const INTERCEPTOR_TEMPLATES_COLUMNS: ColDef[] = [
  { field: 'displayName', headerName: 'Display name', sort: 'asc' },
  { field: 'name', headerName: 'ID' },
  { field: 'description', headerName: 'Description' },
];

export const PROMPTS_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'Name', sort: 'asc' },
  { field: 'version', headerName: 'Version' },
  { field: 'author', headerName: 'Author' },
  {
    field: 'updateTime',
    headerName: 'Update time',
    valueFormatter: ({ value }) => formatDateTimeToLocalString(value),
    tooltipValueGetter: ({ value }) => formatDateTimeToLocalString(value),
  },
];

export const FILES_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'Name', sort: 'asc' },
  { field: 'extension', headerName: 'Extension' },
  { field: 'author', headerName: 'Author' },
];

export const EXPORT_COLUMNS = (onChange: (value: string, name: string) => void, route?: ApplicationRoute): ColDef[] => [
  { field: 'name', headerName: 'Name', sort: 'asc' },
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
  { field: 'author', headerName: 'Author' },
  {
    field: 'updateTime',
    headerName: 'Update time',
    valueFormatter: ({ value }) => formatDateTimeToLocalString(value),
    tooltipValueGetter: ({ value }) => formatDateTimeToLocalString(value),
  },
];

export const PUBLICATION_COLUMNS: ColDef[] = [
  { field: 'requestName', headerName: 'Name' },
  { field: 'author', headerName: 'Author' },
  {
    field: 'createdAt',
    headerName: 'Created at',
    sort: 'asc',
    valueFormatter: ({ value }) => formatDateTimeToLocalString(value),
    tooltipValueGetter: ({ value }) => formatDateTimeToLocalString(value),
  },
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

export const TELEMETRY_GRID_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'Deployment ID' },
  {
    field: 'requests',
    headerName: 'Request Count',
    cellClass: 'align-right',
    comparator: numberValueComparator,
    valueFormatter: (params) => numberValueFormatter(params),
  },
  {
    field: 'prompts',
    headerName: 'Prompt Tokens',
    cellClass: 'align-right',
    comparator: numberValueComparator,
    valueFormatter: (params) => numberValueFormatter(params),
  },
  {
    field: 'completions',
    headerName: 'Completion tokens',
    cellClass: 'align-right',
    comparator: numberValueComparator,
    valueFormatter: (params) => numberValueFormatter(params),
  },
  {
    field: 'cost',
    headerName: 'Money',
    sort: 'desc',
    cellClass: 'align-right',
    comparator: numberValueComparator,
    valueFormatter: (params) => numberValueFormatter(params),
  },
];

export const PROJECT_GRID_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'Project' },
  {
    field: 'requests',
    headerName: 'Request Count',
    cellClass: 'align-right',
    comparator: numberValueComparator,
    valueFormatter: (params) => numberValueFormatter(params),
  },
  {
    field: 'prompts',
    headerName: 'Prompt Tokens',
    cellClass: 'align-right',
    comparator: numberValueComparator,
    valueFormatter: (params) => numberValueFormatter(params),
  },
  {
    field: 'completions',
    headerName: 'Completion tokens',
    cellClass: 'align-right',
    comparator: numberValueComparator,
    valueFormatter: (params) => numberValueFormatter(params),
  },
  {
    field: 'cost',
    headerName: 'Money',
    sort: 'desc',
    cellClass: 'align-right',
    comparator: numberValueComparator,
    valueFormatter: (params) => numberValueFormatter(params),
  },
];

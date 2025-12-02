import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { SelectOption, Step } from '@epam/ai-dial-ui-kit';
import { CONTAINER_STATUS, CONTAINER_TRANSPORT, CreateSteps, KubEventType } from '@/src/types/deployments/containers';
import { ToolsetTransport } from '@/src/types/toolset';
import StatusIndicator from '@/src/components/Common/StatusIndicator/StatusIndicator';
import { STATUS_I18N_KEYS } from '@/src/constants/deployments/images';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { ApplicationRoute } from '@/src/types/routes';
import { ContainersI18nKey, KubEventsI18nKey } from '@/src/constants/i18n';
import { getTranslatedType } from '@/src/utils/deployments/entity';

const POD_OBJECT_KIND = 'pod';

export const ENTITY_TRANSPORT: Record<CONTAINER_TRANSPORT, ToolsetTransport> = {
  [CONTAINER_TRANSPORT.SSE]: ToolsetTransport.SSE,
  [CONTAINER_TRANSPORT.HTTP]: ToolsetTransport.HTTP,
};

export const CONTAINERS_COLUMNS = (t: (key: string) => string): ColDef[] => [
  { field: 'name', headerName: 'Name', hide: false },
  { field: 'description', headerName: 'Description', hide: false },
  { field: 'imageDefinitionId', headerName: 'Container Image', hide: false },
  {
    field: 'status',
    headerName: 'Status',
    hide: false,
    cellRenderer: (params: ICellRendererParams) => <StatusIndicator status={params.data.status} />,
    tooltipValueGetter: ({ value }) => t(STATUS_I18N_KEYS[value as CONTAINER_STATUS]),
    filterValueGetter: (params) => t(STATUS_I18N_KEYS[params.data[params.colDef.field || ''] as CONTAINER_STATUS]),
  },
  { field: 'id', headerName: 'ID', hide: true },
  { field: 'url', headerName: 'Container URL', hide: true },
  { field: 'author', headerName: 'Author', hide: true },
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

const EVENT_TYPES: Record<KubEventType, string> = {
  [KubEventType.NORMAL]: KubEventsI18nKey.Normal,
  [KubEventType.WARNING]: KubEventsI18nKey.Warning,
};

export const TRANSPORTS: SelectOption[] = [
  { label: 'HTTP', value: CONTAINER_TRANSPORT.HTTP },
  { label: 'SSE', value: CONTAINER_TRANSPORT.SSE },
];

export const CREATE_CONTAINER_STEPS = (
  route: ApplicationRoute,
  t: (key: string, options?: Record<string, string | number>) => string,
): Step[] => [
  {
    id: CreateSteps.IMAGE,
    name: t(ContainersI18nKey.ContainerImage, { type: getTranslatedType(route, t) }),
  },
  { id: CreateSteps.PROPERTIES, name: t(ContainersI18nKey.ContainerProperties) },
];

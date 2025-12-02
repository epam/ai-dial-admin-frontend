import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { SelectOption, SelectVariant } from '@epam/ai-dial-ui-kit';
import TopicsCellRenderer from '@/src/components/Grid/CellRenderers/TopicCellRenderer';
import StatusIndicator from '@/src/components/Common/StatusIndicator/StatusIndicator';
import { IMAGE_SOURCE_TYPE, IMAGE_STATUS, IMAGE_TRANSPORT_TYPE, IMAGE_TYPE } from '@/src/types/deployments/images';
import VersionsSelect from '@/src/components/Common/VersionsSelect/VersionsSelect';
import { Image, ImageVersion } from '@/src/models/deployments/images';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { ContainersI18nKey, ImagesI18nKey, KubEventsI18nKey } from '@/src/constants/i18n';
import { CONTAINER_STATUS, KubEventType } from '@/src/types/deployments/containers';

export const BASE_IMAGE_LIST_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'Name', hide: false },
  { field: 'version', headerName: 'Version', hide: false },
  { field: 'description', headerName: 'Description', hide: false },
  {
    field: 'topics',
    headerName: 'Topics',
    hide: false,
    cellRenderer: (params: ICellRendererParams) => <TopicsCellRenderer topics={params.data?.topics || []} />,
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
    cellRenderer: (params: ICellRendererParams) => <StatusIndicator status={params.data?.status} />,
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
        <TopicsCellRenderer
          topics={params.data.availableVersions.find((v: ImageVersion) => v.id === params.data.selectedId).topics || []}
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
    cellRenderer: (params: ICellRendererParams) => <StatusIndicator status={params.data?.buildStatus} />,
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
    cellRenderer: (params: ICellRendererParams) => <StatusIndicator status={params.data.status} />,
    tooltipValueGetter: ({ value }) => t(STATUS_I18N_KEYS[value as IMAGE_STATUS]),
    filterValueGetter: (params) => t(STATUS_I18N_KEYS[params.data[params.colDef.field || ''] as IMAGE_STATUS]),
  },
];

export const SOURCES: SelectOption[] = [
  { label: ImagesI18nKey.SourceDocker, value: IMAGE_SOURCE_TYPE.DOCKER },
  { label: ImagesI18nKey.SourceCode, value: IMAGE_SOURCE_TYPE.CODE },
];

export const TRANSPORT_TYPES: { id: IMAGE_TRANSPORT_TYPE; name: string }[] = [
  { name: 'Local (STDIO)', id: IMAGE_TRANSPORT_TYPE.LOCAL },
  { name: 'Remote (HTTP/SSE)', id: IMAGE_TRANSPORT_TYPE.REMOTE },
];

export const STATUS_I18N_KEYS: Record<IMAGE_STATUS | CONTAINER_STATUS | KubEventType, string> = {
  [IMAGE_STATUS.BUILT]: ImagesI18nKey.Installed,
  [IMAGE_STATUS.BUILDING]: ImagesI18nKey.Installing,
  [IMAGE_STATUS.NOT_BUILT]: ImagesI18nKey.NotInstalled,
  [IMAGE_STATUS.BUILD_FAILED]: ImagesI18nKey.InstallationFailed,
  [CONTAINER_STATUS.RUNNING]: ContainersI18nKey.Running,
  [CONTAINER_STATUS.PENDING]: ContainersI18nKey.Preparing,
  [CONTAINER_STATUS.NOT_DEPLOYED]: ContainersI18nKey.NotRunning,
  [CONTAINER_STATUS.FAILED]: ContainersI18nKey.Failed,
  [CONTAINER_STATUS.STOPPED]: ContainersI18nKey.Stopped,
  [KubEventType.NORMAL]: KubEventsI18nKey.Normal,
  [KubEventType.WARNING]: KubEventsI18nKey.Warning,
};

export const STATUS_CLASSNAMES: Record<IMAGE_STATUS | CONTAINER_STATUS | KubEventType, string> = {
  [IMAGE_STATUS.BUILT]: 'bg-accent-secondary',
  [IMAGE_STATUS.BUILDING]: '',
  [IMAGE_STATUS.NOT_BUILT]: 'bg-red-400',
  [IMAGE_STATUS.BUILD_FAILED]: 'bg-red-400',
  [CONTAINER_STATUS.RUNNING]: 'bg-accent-secondary',
  [CONTAINER_STATUS.PENDING]: '',
  [CONTAINER_STATUS.NOT_DEPLOYED]: 'bg-red-400',
  [CONTAINER_STATUS.FAILED]: 'bg-red-400',
  [CONTAINER_STATUS.STOPPED]: 'bg-orange-400',
  [KubEventType.NORMAL]: 'bg-controls-disable',
  [KubEventType.WARNING]: 'bg-red-400',
};

export const MCP_IMAGE_TEMPLATE: Image = {
  id: '',
  $type: IMAGE_TYPE.MCP,
  version: '1.0.0',
  name: '',
  description: '',
  source: {
    $type: SOURCES[0].value as IMAGE_SOURCE_TYPE,
    imageUri: '',
    url: '',
  },
  transportType: IMAGE_TRANSPORT_TYPE.LOCAL,
  topics: [],
  buildStatus: IMAGE_STATUS.NOT_BUILT,
};

export const INTERCEPTOR_IMAGE_TEMPLATE: Image = {
  id: '',
  $type: IMAGE_TYPE.INTERCEPTOR,
  version: '1.0.0',
  name: '',
  description: '',
  source: {
    $type: IMAGE_SOURCE_TYPE.DOCKER,
    imageUri: '',
  },
  topics: [],
  buildStatus: IMAGE_STATUS.NOT_BUILT,
};
export const MODEL_IMAGE_TEMPLATE: Image = {
  id: '',
  $type: IMAGE_TYPE.MODEL,
  version: '1.0.0',
  name: '',
  description: '',
  source: {
    $type: IMAGE_SOURCE_TYPE.DOCKER,
    imageUri: '',
  },
  topics: [],
  buildStatus: IMAGE_STATUS.NOT_BUILT,
};

export const IMAGE_BUILD_POLL_INTERVAL = 5000;

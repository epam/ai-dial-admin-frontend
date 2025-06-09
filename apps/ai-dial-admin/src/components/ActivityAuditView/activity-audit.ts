import { ColDef, ICellRendererParams } from 'ag-grid-community';
import PasswordCellRenderer from './CellRenderer/PasswordCellRenderer';
import ExtraDataCellRenderer from './CellRenderer/ExtraDataCellRenderer';

export const INTERCEPTORS_DIFF_COLUMNS = [
  { field: 'parameter', headerName: 'Order', width: 90, maxWidth: 90 },
  { field: 'value', headerName: 'Name' },
];

export const ENTITIES_DIFF_COLUMNS = [{ field: 'parameter', headerName: 'Name' }];

export const ROLE_LIMITS_DIFF_COLUMNS = [
  { field: 'parameter', headerName: 'Name' },
  { field: 'minute', headerName: 'Per minute' },
  { field: 'day', headerName: 'Per day' },
  { field: 'week', headerName: 'Per week' },
  { field: 'month', headerName: 'Per month' },
];

export const RESOURCE_DIFF_COLUMNS = (t: (stringToTranslate: string) => string): ColDef[] => [
  {
    field: 'parameter',
    headerName: 'Parameter',
    valueFormatter: ({ value }) => formatParameter(value, t),
    tooltipValueGetter: ({ value }) => formatParameter(value, t),
  },
  {
    field: 'value',
    headerName: 'Value',
    cellRendererSelector: (params: ICellRendererParams) => {
      switch (params.data?.parameter) {
        case 'key':
          return { component: PasswordCellRenderer };
        case 'extraData':
          return { component: ExtraDataCellRenderer };
        default:
          return void 0;
      }
    },
  },
];

export const formatParameter = (value: string, t: (stringToTranslate: string) => string) => {
  const key = ParameterNamesI18nKey[value as keyof typeof ParameterNamesI18nKey];
  return key ? t(key) : value;
};

export enum EntityParameterKeys {
  TOPICS = 'topics',
  LIMITS = 'limits',
  PRICING = 'pricing',
  INTERCEPTORS = 'interceptors',
  ROLES = 'roles',
  ROLE_LIMITS = 'roleLimits',
  DEFAULT_ROLE_LIMIT = 'defaultRoleLimit',
  UPSTREAMS = 'upstreams',
  FEATURES = 'features',
  ENABLED = 'enabled',
  PROPERTIES = 'properties',
  PATHS = 'paths',
  METHODS = 'methods',
  RESPONSE = 'response',
  APPLICATIONS = 'applications',
  ENTITIES = 'entities',
  DEFS = '$defs',
  KEYS = 'grantedKeys',
  PARAMETERS = 'parameters',
}

export enum ParameterNamesI18nKey {
  roleLimits = 'ParameterNames.roleLimits',
  isPublic = 'ParameterNames.isPublic',
  defaultRoleLimit = 'ParameterNames.defaultRoleLimit',
  name = 'ParameterNames.name',
  endpoint = 'ParameterNames.endpoint',
  displayName = 'ParameterNames.displayName',
  displayVersion = 'ParameterNames.displayVersion',
  iconUrl = 'ParameterNames.iconUrl',
  description = 'ParameterNames.description',
  forwardAuthToken = 'ParameterNames.forwardAuthToken',
  features = 'ParameterNames.features',
  rateEndpoint = 'ParameterNames.rateEndpoint',
  tokenizeEndpoint = 'ParameterNames.tokenizeEndpoint',
  truncatePromptEndpoint = 'ParameterNames.truncatePromptEndpoint',
  configurationEndpoint = 'ParameterNames.configurationEndpoint',
  systemPromptSupported = 'ParameterNames.systemPromptSupported',
  toolsSupported = 'ParameterNames.toolsSupported',
  seedSupported = 'ParameterNames.seedSupported',
  urlAttachmentsSupported = 'ParameterNames.urlAttachmentsSupported',
  folderAttachmentsSupported = 'ParameterNames.folderAttachmentsSupported',
  allowResume = 'ParameterNames.allowResume',
  accessibleByPerRequestKey = 'ParameterNames.accessibleByPerRequestKey',
  contentPartsSupported = 'ParameterNames.contentPartsSupported',
  temperatureSupported = 'ParameterNames.temperatureSupported',
  addonsSupported = 'ParameterNames.addonsSupported',
  inputAttachmentTypes = 'ParameterNames.inputAttachmentTypes',
  maxInputAttachments = 'ParameterNames.maxInputAttachments',
  defaults = 'ParameterNames.defaults',
  topics = 'ParameterNames.topics',
  maxRetryAttempts = 'ParameterNames.maxRetryAttempts',
  type = 'ParameterNames.type',
  tokenizerModel = 'ParameterNames.tokenizerModel',
  limits = 'ParameterNames.limits',
  maxTotalTokens = 'ParameterNames.maxTotalTokens',
  pricing = 'ParameterNames.pricing',
  unit = 'ParameterNames.unit',
  prompt = 'ParameterNames.prompt',
  completion = 'ParameterNames.completion',
  upstreams = 'ParameterNames.upstreams',
  key = 'ParameterNames.key',
  weight = 'ParameterNames.weight',
  tier = 'ParameterNames.tier',
  overrideName = 'ParameterNames.overrideName',
  properties = 'ParameterNames.properties',
  enabled = 'ParameterNames.enabled',
  minute = 'ParameterNames.minute',
  day = 'ParameterNames.day',
  week = 'ParameterNames.week',
  month = 'ParameterNames.month',
  interceptors = 'ParameterNames.interceptors',
  roles = 'ParameterNames.roles',
  paths = 'ParameterNames.paths',
  methods = 'ParameterNames.methods',
  status = 'ParameterNames.status',
  body = 'ParameterNames.body',
  $defs = 'ParameterNames.$defs',
  $id = 'ParameterNames.$id',
  $schema = 'ParameterNames.$schema',
  applications = 'ParameterNames.applications',
  entities = 'ParameterNames.entities',
  'dial:applicationTypeCompletionEndpoint' = 'ParameterNames.applicationTypeCompletionEndpoint',
  'dial:applicationTypeDisplayName' = 'ParameterNames.applicationTypeDisplayName',
  'dial:applicationTypeEditorUrl' = 'ParameterNames.applicationTypeEditorUrl',
  'dial:applicationTypeViewerUrl' = 'ParameterNames.applicationTypeViewerUrl',
  grantedKeys = 'ParameterNames.grantedKeys',
  createdAt = 'ParameterNames.createdAt',
  expiresAt = 'ParameterNames.expiresAt',
  keyGeneratedAt = 'ParameterNames.keyGeneratedAt',
  project = 'ParameterNames.project',
  projectContactPoint = 'ParameterNames.projectContactPoint',
  secured = 'ParameterNames.secured',
  parameters = 'ParameterNames.parameters',
  extraData = 'ParameterNames.extraData',
}

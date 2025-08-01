import { FeaturesI18nKey } from '@/src/constants/i18n';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ActivityAuditEntity } from '@/src/types/activity-audit';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import ExtraDataCellRenderer from './CellRenderer/ExtraDataCellRenderer';
import PasswordCellRenderer from './CellRenderer/PasswordCellRenderer';

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
  const parametersKey = ParameterNamesI18nKey[value as keyof typeof ParameterNamesI18nKey];
  if (parametersKey) {
    return t(parametersKey);
  }
  const featuresKey = FeaturesI18nKey[value as keyof typeof FeaturesI18nKey];

  if (featuresKey) {
    return t(featuresKey);
  }
  return value;
};

export const getCurrentAndRollbackEntities = (
  entity: EntitiesGridData,
  id: string,
  currentEntities?: EntitiesGridData[],
  rollbackEntities?: EntitiesGridData[],
): { current: ActivityAuditEntity | undefined; rollback: ActivityAuditEntity | undefined } => {
  const resolveEntityById = (
    fallback: EntitiesGridData,
    entities?: EntitiesGridData[],
  ): EntitiesGridData | undefined => {
    if (!entities) return fallback;

    return entities.find((item) => item && (item.name === id || item.key === id || item.$id === id));
  };

  return {
    current: resolveEntityById(entity, currentEntities) as ActivityAuditEntity,
    rollback: resolveEntityById(entity, rollbackEntities) as ActivityAuditEntity,
  };
};

export enum EntityParameterKeys {
  TOPICS = 'topics',
  HASHING_ORDER = 'fieldsHashingOrder',
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
  MODELS = 'models',
}

export enum ParameterNamesI18nKey {
  roleLimits = 'ParameterNames.roleLimits',
  isPublic = 'ParameterNames.isPublic',
  defaultRoleLimit = 'ParameterNames.defaultRoleLimit',
  fieldsHashingOrder = 'ParameterNames.fieldsHashingOrder',
  endpointDeploymentName = 'ParameterNames.endpointDeploymentName',
  name = 'ParameterNames.name',
  author = 'ParameterNames.author',
  endpoint = 'ParameterNames.endpoint',
  displayName = 'ParameterNames.displayName',
  displayVersion = 'ParameterNames.displayVersion',
  adapter = 'ParameterNames.adapter',
  iconUrl = 'ParameterNames.iconUrl',
  description = 'ParameterNames.description',
  forwardAuthToken = 'ParameterNames.forwardAuthToken',
  features = 'ParameterNames.features',
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
  'dial:applicationTypeConfigurationEndpoint' = 'ParameterNames.applicationTypeConfigurationEndpoint',
  'dial:applicationTypeRateEndpoint' = 'ParameterNames.applicationTypeRateEndpoint',
  'dial:applicationTypeTokenizeEndpoint' = 'ParameterNames.applicationTypeTokenizeEndpoint',
  'dial:applicationTypeTruncatePromptEndpoint' = 'ParameterNames.applicationTypeTruncatePromptEndpoint',
  'dial:appendApplicationPropertiesHeader' = 'ParameterNames.appendApplicationPropertiesHeader',
  grantedKeys = 'ParameterNames.grantedKeys',
  createdAt = 'ParameterNames.createdAt',
  expiresAt = 'ParameterNames.expiresAt',
  keyGeneratedAt = 'ParameterNames.keyGeneratedAt',
  project = 'ParameterNames.project',
  projectContactPoint = 'ParameterNames.projectContactPoint',
  secured = 'ParameterNames.secured',
  parameters = 'ParameterNames.parameters',
  extraData = 'ParameterNames.extraData',
  models = 'ParameterNames.models',
}

import { ColDef } from 'ag-grid-community';

import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import {
  ENTITY_WITH_VERSION_COLUMNS,
  KEY_ENTITY_COLUMNS,
  RUNNERS_COLUMNS,
  SIMPLE_ENTITY_COLUMNS,
  SIMPLE_DESCRIPTION_COLUMNS,
} from '@/src/constants/grid-columns/grid-columns';
import { SortDirectionDto } from '@/src/types/request';

export const SYSTEM_ROLLBACK_ID = 'system-rollback';
export const SYSTEM_ROLLBACK_ENTITIES = [
  ActivityAuditResourceType.MODEL,
  ActivityAuditResourceType.APPLICATION,
  ActivityAuditResourceType.ROUTE,
  ActivityAuditResourceType.ROLE,
  ActivityAuditResourceType.KEY,
  ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA,
  ActivityAuditResourceType.INTERCEPTOR,
  ActivityAuditResourceType.ADAPTER,
  // ActivityAuditResourceType.ASSISTANT,
  // ActivityAuditResourceType.ADDON,
];

export const SYSTEM_ROLLBACK_TAB_NAME: Record<ActivityAuditResourceType, string> = {
  [ActivityAuditResourceType.MODEL]: 'Models',
  [ActivityAuditResourceType.APPLICATION]: 'Applications',
  [ActivityAuditResourceType.ADAPTER]: 'Adapters',
  [ActivityAuditResourceType.ASSISTANT]: 'Assistants',
  [ActivityAuditResourceType.INTERCEPTOR]: 'Interceptors',
  [ActivityAuditResourceType.KEY]: 'Keys',
  [ActivityAuditResourceType.ROLE]: 'Roles',
  [ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA]: 'ApplicationRunners',
  [ActivityAuditResourceType.ADDON]: 'Addons',
  [ActivityAuditResourceType.ROUTE]: 'Routes',
};

export const getSystemRollbackColumns = (
  type: ActivityAuditResourceType,
  t: (stringToTranslate: string) => string,
): ColDef[] => {
  switch (type) {
    case ActivityAuditResourceType.MODEL:
    case ActivityAuditResourceType.APPLICATION:
    case ActivityAuditResourceType.ASSISTANT:
    case ActivityAuditResourceType.ADDON:
      return ENTITY_WITH_VERSION_COLUMNS(t, []);
    case ActivityAuditResourceType.ADAPTER:
      return SIMPLE_DESCRIPTION_COLUMNS;
    case ActivityAuditResourceType.INTERCEPTOR:
    case ActivityAuditResourceType.ROLE:
    case ActivityAuditResourceType.ROUTE:
      return SIMPLE_ENTITY_COLUMNS;
    case ActivityAuditResourceType.KEY:
      return KEY_ENTITY_COLUMNS;
    case ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA:
      return RUNNERS_COLUMNS;
    default:
      return [];
  }
};

export const sorts = [
  {
    column: 'id',
    direction: SortDirectionDto.DESC,
  },
];

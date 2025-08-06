import { ColDef } from 'ag-grid-community';

import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import {
  APPLICATIONS_COLUMNS,
  KEYS_COLUMNS,
  RUNNERS_COLUMNS,
  SIMPLE_ENTITY_COLUMNS,
  SIMPLE_DESCRIPTION_COLUMNS,
  MODELS_COLUMNS,
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
];

export const SYSTEM_ROLLBACK_TAB_NAME: Record<ActivityAuditResourceType, string> = {
  [ActivityAuditResourceType.MODEL]: 'Models',
  [ActivityAuditResourceType.APPLICATION]: 'Applications',
  [ActivityAuditResourceType.ADAPTER]: 'Adapters',
  [ActivityAuditResourceType.INTERCEPTOR]: 'Interceptors',
  [ActivityAuditResourceType.KEY]: 'Keys',
  [ActivityAuditResourceType.ROLE]: 'Roles',
  [ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA]: 'ApplicationRunners',
  [ActivityAuditResourceType.ROUTE]: 'Routes',
};

export const getSystemRollbackColumns = (
  type: ActivityAuditResourceType,
  t: (stringToTranslate: string) => string,
): ColDef[] => {
  switch (type) {
    case ActivityAuditResourceType.MODEL:
      return MODELS_COLUMNS(t);
    case ActivityAuditResourceType.APPLICATION:
      return APPLICATIONS_COLUMNS(t);
    case ActivityAuditResourceType.ADAPTER:
      return SIMPLE_DESCRIPTION_COLUMNS;
    case ActivityAuditResourceType.INTERCEPTOR:
    case ActivityAuditResourceType.ROLE:
    case ActivityAuditResourceType.ROUTE:
      return SIMPLE_ENTITY_COLUMNS;
    case ActivityAuditResourceType.KEY:
      return KEYS_COLUMNS;
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

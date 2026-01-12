import { ColDef } from 'ag-grid-community';

import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import {
  APPLICATIONS_COLUMNS,
  KEYS_COLUMNS,
  MODELS_COLUMNS,
  LIST_RUNNER_COLUMNS,
  SIMPLE_ENTITY_COLUMNS,
} from '@/src/constants/grid-columns/grid-columns';
import { ApplicationRoute } from '@/src/types/routes';

export const getSystemRollbackColumns = (
  type: ActivityAuditResourceType,
  t: (stringToTranslate: string) => string,
): ColDef[] => {
  switch (type) {
    case ActivityAuditResourceType.MODEL:
      return MODELS_COLUMNS(t, ApplicationRoute.Models);
    case ActivityAuditResourceType.APPLICATION:
      return APPLICATIONS_COLUMNS(t);
    case ActivityAuditResourceType.ADAPTER:
    case ActivityAuditResourceType.INTERCEPTOR:
    case ActivityAuditResourceType.ROLE:
    case ActivityAuditResourceType.ROUTE:
    case ActivityAuditResourceType.TOOLSET:
    case ActivityAuditResourceType.INTERCEPTOR_TEMPLATE:
      return SIMPLE_ENTITY_COLUMNS;
    case ActivityAuditResourceType.KEY:
      return KEYS_COLUMNS(t);
    case ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA:
      return LIST_RUNNER_COLUMNS;
    default:
      return [];
  }
};

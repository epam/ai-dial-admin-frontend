import { ColDef } from 'ag-grid-community';

import {
  APPLICATIONS_COLUMNS,
  KEYS_COLUMNS,
  LIST_RUNNER_COLUMNS,
  MODELS_COLUMNS,
  BASE_COLUMNS,
} from '@/src/constants/grid-columns/grid-columns';
import { ActivityAuditResourceType } from '@/src/types/activity-audit';

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
    case ActivityAuditResourceType.INTERCEPTOR:
    case ActivityAuditResourceType.ROLE:
    case ActivityAuditResourceType.ROUTE:
    case ActivityAuditResourceType.TOOLSET:
    case ActivityAuditResourceType.INTERCEPTOR_TEMPLATE:
      return BASE_COLUMNS;
    case ActivityAuditResourceType.KEY:
      return KEYS_COLUMNS(t);
    case ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA:
      return LIST_RUNNER_COLUMNS;
    default:
      return [];
  }
};

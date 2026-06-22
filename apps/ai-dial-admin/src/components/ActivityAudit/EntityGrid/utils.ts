import { ColDef } from 'ag-grid-community';

import {
  DOMAINS_DIFF_COLUMNS,
  ENTITIES_DIFF_COLUMNS,
  INTERCEPTORS_DIFF_COLUMNS,
  RESOURCE_DIFF_COLUMNS,
  ROLE_LIMITS_DIFF_COLUMNS,
} from '@/src/components/ActivityAudit/EntityGrid/constants';
import { EntityParameterKeys } from '@/src/components/ActivityAudit/constants';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ActivityAuditEntity, ActivityAuditResourceType } from '@/src/types/activity-audit';
import { InlineTextDiffSide } from '@/src/utils/diff/models';

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

export const getColumnsByParameter = (
  parameter?: string,
  index?: number,
  t?: (stringToTranslate: string) => string,
  type?: ActivityAuditResourceType,
  diffSide?: InlineTextDiffSide,
): ColDef[] => {
  if (parameter === EntityParameterKeys.ROLES && (index === 1 || type === ActivityAuditResourceType.ROLE)) {
    return ROLE_LIMITS_DIFF_COLUMNS;
  }

  if (
    parameter === EntityParameterKeys.INTERCEPTORS ||
    parameter === EntityParameterKeys.GLOBAL_INTERCEPTORS ||
    parameter === EntityParameterKeys.APP_RUNNER_INTERCEPTORS
  ) {
    return INTERCEPTORS_DIFF_COLUMNS(diffSide, t, parameter, type);
  }

  if (
    parameter === EntityParameterKeys.APPLICATIONS ||
    parameter === EntityParameterKeys.ENTITIES ||
    parameter === EntityParameterKeys.KEYS ||
    parameter === EntityParameterKeys.MODELS ||
    parameter === EntityParameterKeys.ROUTES ||
    parameter === EntityParameterKeys.DEPENDENCIES ||
    (parameter === EntityParameterKeys.ROLES && type === ActivityAuditResourceType.KEY)
  ) {
    return ENTITIES_DIFF_COLUMNS;
  }

  if (parameter === EntityParameterKeys.DOMAINS) {
    return DOMAINS_DIFF_COLUMNS(diffSide, t, parameter, type);
  }
  return RESOURCE_DIFF_COLUMNS(t as (stringToTranslate: string) => string, parameter, type, diffSide);
};

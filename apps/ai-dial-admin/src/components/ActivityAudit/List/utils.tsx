import { ColDef } from 'ag-grid-community';

import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import {
  getOpenInNewTabOperation,
  getResourceRollbackOperation,
  getViewDetailsOperation,
} from '@/src/constants/grid-columns/actions';
import { ACTIVITY_AUDIT_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { DialActivity } from '@/src/models/activity-audit';
import { GridFilter } from '@/src/models/grid-filter';
import { FilterDto } from '@/src/models/request';
import { TimeRange } from '@/src/models/time-range';
import { FilterOperatorDto } from '@/src/types/request';
import { formatDateToLocalString } from '@/src/utils/formatting/date';
import { getRequestFilters } from '@/src/utils/request/get-request-filters';
import { ActivityAuditRevision } from '@/src/components/ActivityAudit/models';
import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { ApplicationRoute } from '@/src/types/routes';

/**
 * Generate columns with actions for activity audit grid
 *
 * @param {(activity: DialActivity) => void} open - open in new tab action
 * @param {(activity: DialActivity) => void} resourceRollback - rollback action
 * @returns {ColDef[]} - columns
 */
export const getActivityAuditColumns = (
  t: (key: string) => string,
  open?: (activity?: DialActivity) => void,
  resourceRollback?: (activity?: DialActivity) => void,
  viewDetails?: (activity?: DialActivity) => void,
  isSingleEntity?: boolean,
): ColDef[] => {
  const actions = [];
  if (open) {
    actions.push(getOpenInNewTabOperation(open));
  }
  if (viewDetails) {
    actions.push(getViewDetailsOperation(viewDetails));
  }
  if (resourceRollback) {
    actions.push(getResourceRollbackOperation(resourceRollback));
  }

  return [...ACTIVITY_AUDIT_COLUMNS(t, isSingleEntity), ACTION_COLUMN(actions)];
};

/**
 * Generate filters for grid data request
 *
 * @param {Record<string, GridFilter>} gridFilter - grid filter object
 * @param {TimeRange} timeRange - time range selection
 * @returns {FilterDto[]} - filter for audit data
 */
export const getGridFilters = (gridFilter: Record<string, GridFilter>, timeRange: TimeRange): FilterDto[] => {
  const filters = getRequestFilters(gridFilter);
  const timeFilters: FilterDto[] = [
    {
      column: 'epochTimestampMs',
      operator: FilterOperatorDto.GREATER_THEN_OR_EQUAL,
      value: timeRange.startDate.getTime().toString(),
    },
    {
      column: 'epochTimestampMs',
      operator: FilterOperatorDto.LESS_THEN_OR_EQUAL,
      value: timeRange.endDate.getTime().toString(),
    },
  ];
  return [...filters, ...timeFilters];
};

/**
 * Group revisions by date
 *
 * @param {ActivityAuditRevision[]} revisions - array of revisions
 * @returns {Record<string, ActivityAuditRevision[]>} - map of grouped revisions by date
 */
export const groupByDay = (revisions: ActivityAuditRevision[]): Record<string, ActivityAuditRevision[]> => {
  const todayKey = formatDateToLocalString(new Date().getTime());

  return revisions.reduce(
    (acc, obj) => {
      const key = new Date(obj.timestamp).toLocaleDateString();

      const groupKey = key === todayKey ? 'Today' : key;

      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(obj);

      return acc;
    },
    {} as Record<string, ActivityAuditRevision[]>,
  );
};

export const getAuditActivityHref = (
  entityType?: ActivityAuditResourceType,
  resourceId?: string,
  activityId?: string,
) => {
  if (!entityType || !resourceId || !activityId) {
    return '';
  }

  let originalRoute = '';
  if (entityType === ActivityAuditResourceType.MODEL) {
    originalRoute = ApplicationRoute.Models?.split('/')?.[1];
  } else if (entityType === ActivityAuditResourceType.APPLICATION) {
    originalRoute = ApplicationRoute.Applications?.split('/')?.[1];
  } else if (entityType === ActivityAuditResourceType.TOOLSET) {
    originalRoute = ApplicationRoute.Toolsets?.split('/')?.[1];
  } else if (entityType === ActivityAuditResourceType.INTERCEPTOR) {
    originalRoute = ApplicationRoute.Interceptors?.split('/')?.[1];
  } else if (entityType === ActivityAuditResourceType.ROUTE) {
    originalRoute = ApplicationRoute.Routes?.split('/')?.[1];
  } else if (entityType === ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA) {
    originalRoute = ApplicationRoute.ApplicationRunners?.split('/')?.[1];
  } else if (entityType === ActivityAuditResourceType.INTERCEPTOR_TEMPLATE) {
    originalRoute = ApplicationRoute.InterceptorTemplates?.split('/')?.[1];
  } else if (entityType === ActivityAuditResourceType.ADAPTER) {
    originalRoute = ApplicationRoute.Adapters?.split('/')?.[1];
  } else if (entityType === ActivityAuditResourceType.ROLE) {
    originalRoute = ApplicationRoute.Roles?.split('/')?.[1];
  } else if (entityType === ActivityAuditResourceType.KEY) {
    originalRoute = ApplicationRoute.Keys?.split('/')?.[1];
  }

  return originalRoute ? `/${originalRoute}/${encodeURIComponent(resourceId)}/${encodeURIComponent(activityId)}` : '';
};

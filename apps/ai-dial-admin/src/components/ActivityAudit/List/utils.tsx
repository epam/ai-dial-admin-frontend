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
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialApplicationScheme } from '@/src/models/dial/application';

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
    actions.push(
      getResourceRollbackOperation(resourceRollback, (_, node) => {
        return !!(node.data as DialActivity & { children?: DialActivity[] })?.children?.length;
      }),
    );
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
      operator: FilterOperatorDto.GREATER_THAN_OR_EQUAL,
      value: timeRange.startDate.getTime().toString(),
    },
    {
      column: 'epochTimestampMs',
      operator: FilterOperatorDto.LESS_THAN_OR_EQUAL,
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

export const getStartOfDay = (date: Date): Date => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
};

export const getEndOfDay = (date: Date): Date => {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
};

export const getAuditActivityHref = (
  entity?: BaseEntity | DialApplicationScheme,
  entityType?: ActivityAuditResourceType,
  activityId?: string,
) => {
  if (!entityType || !entity || !activityId) {
    return '';
  }

  let route: ApplicationRoute;
  switch (entityType) {
    case ActivityAuditResourceType.MODEL:
      route = ApplicationRoute.Models;
      break;
    case ActivityAuditResourceType.APPLICATION:
      route = ApplicationRoute.Applications;
      break;
    case ActivityAuditResourceType.TOOLSET:
      route = ApplicationRoute.Toolsets;
      break;
    case ActivityAuditResourceType.INTERCEPTOR:
      route = ApplicationRoute.Interceptors;
      break;
    case ActivityAuditResourceType.ROUTE:
      route = ApplicationRoute.Routes;
      break;
    case ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA:
      route = ApplicationRoute.ApplicationRunners;
      break;
    case ActivityAuditResourceType.INTERCEPTOR_TEMPLATE:
      route = ApplicationRoute.InterceptorTemplates;
      break;
    case ActivityAuditResourceType.ADAPTER:
      route = ApplicationRoute.Adapters;
      break;
    case ActivityAuditResourceType.ROLE:
      route = ApplicationRoute.Roles;
      break;
    case ActivityAuditResourceType.KEY:
      route = ApplicationRoute.Keys;
      break;
    default:
      return '';
  }

  return route ? `${getUrnForEntity(route, entity)}/${encodeURIComponent(activityId)}` : '';
};

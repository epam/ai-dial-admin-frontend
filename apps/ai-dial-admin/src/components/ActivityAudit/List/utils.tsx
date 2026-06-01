import { ColDef } from 'ag-grid-community';

import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import {
  getOpenInNewTabOperation,
  getResourceRollbackOperation,
  getViewDetailsOperation,
} from '@/src/constants/grid-columns/actions';
import { ResourceTypeLabelMap } from '@/src/constants/grid-columns/formatters';
import { ACTIVITY_AUDIT_COLUMNS, RESOURCE_TYPE_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import { DialActivity } from '@/src/models/activity-audit';
import { GridFilter } from '@/src/models/grid-filter';
import { FilterDto } from '@/src/models/request';
import { TimeRange } from '@/src/models/time-range';
import { GridFilterType } from '@/src/types/grid-filter';
import { FilterOperatorDto } from '@/src/types/request';
import { formatDateToLocalString } from '@/src/utils/formatting/date';
import { getRequestFilters } from '@/src/utils/request/get-request-filters';
import { ActivityAuditRevision } from '@/src/components/ActivityAudit/models';
import { auditResourceRoute } from '@/src/components/ActivityAudit/View/Header/constants';
import { ActivityAuditResourceType, ActivityAuditType, ActivityAuditView } from '@/src/types/activity-audit';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialApplicationScheme } from '@/src/models/dial/application';

const expandResourceTypeFilter = (filter: GridFilter, map: ResourceTypeLabelMap): GridFilter => {
  if (filter.type !== GridFilterType.CONTAINS || typeof filter.filter !== 'string') {
    return filter;
  }
  const needle = filter.filter.toLowerCase();
  if (!needle) {
    return filter;
  }
  const matched = new Set<ActivityAuditResourceType>();
  for (const [label, enumValues] of Object.entries(map)) {
    if (label.includes(needle)) {
      for (const v of enumValues) matched.add(v);
    }
  }
  if (matched.size !== 1) {
    return filter;
  }
  const [only] = matched;
  return { ...filter, type: GridFilterType.EQUALS, filter: only };
};

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
    actions.push(
      getOpenInNewTabOperation(open, void 0, (_, node) => {
        const activityType = (node.data as DialActivity)?.activityType;
        return activityType === ActivityAuditType.Rollback || activityType === ActivityAuditType.Import;
      }),
    );
  }
  if (viewDetails) {
    actions.push(getViewDetailsOperation(viewDetails));
  }
  if (resourceRollback) {
    actions.push(
      getResourceRollbackOperation(resourceRollback, (_, node) => {
        const activityType = (node.data as DialActivity)?.activityType;
        return activityType === ActivityAuditType.Rollback || activityType === ActivityAuditType.Import;
      }),
    );
  }

  return [...ACTIVITY_AUDIT_COLUMNS(t, ActivityAuditView.Config, isSingleEntity), ACTION_COLUMN(actions)];
};

/**
 * Generate columns with actions for the deployment activity audit grid.
 * The only available row action is `Open in new tab`.
 *
 * @param {(activity: DialActivity) => void} open - open in new tab action
 * @returns {ColDef[]} - columns
 */
export const getDeploymentActivityAuditColumns = (
  t: (key: string) => string,
  open?: (activity?: DialActivity) => void,
): ColDef[] => {
  const actions = open ? [getOpenInNewTabOperation(open)] : [];
  return [...ACTIVITY_AUDIT_COLUMNS(t, ActivityAuditView.Deployments), ACTION_COLUMN(actions)];
};

/**
 * Generate filters for grid data request
 *
 * @param {Record<string, GridFilter>} gridFilter - grid filter object
 * @param {TimeRange} timeRange - time range selection
 * @returns {FilterDto[]} - filter for audit data
 */
export const getGridFilters = (
  gridFilter: Record<string, GridFilter>,
  timeRange: TimeRange,
  resourceTypeLabelMap?: ResourceTypeLabelMap,
): FilterDto[] => {
  const transformed =
    resourceTypeLabelMap && gridFilter[RESOURCE_TYPE_COLUMN]
      ? {
          ...gridFilter,
          [RESOURCE_TYPE_COLUMN]: expandResourceTypeFilter(gridFilter[RESOURCE_TYPE_COLUMN], resourceTypeLabelMap),
        }
      : gridFilter;
  const filters = getRequestFilters(transformed);
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
  const route = auditResourceRoute[entityType];
  if (!route) {
    return '';
  }
  return `${getUrnForEntity(route, entity)}/${encodeURIComponent(activityId)}`;
};

export const processActivitiesData = (data: DialActivity[], childrenActivityMap: Record<string, DialActivity[]>) => {
  const processedData: DialActivity[] = [];

  data.forEach((activity: DialActivity) => {
    if (!activity?.parentActivityId) {
      const activityWithChildren = {
        ...activity,
        resourceId:
          activity.resourceType === ActivityAuditResourceType.ADMIN_PROPERTIES ||
          activity.resourceType === ActivityAuditResourceType.SYSTEM_PROPERTIES
            ? ''
            : activity.resourceId,
        children: childrenActivityMap?.[activity.activityId] || [],
        expanded: true,
        canToggleExpand: false,
      };
      processedData.push(activityWithChildren);
    }

    const childrenToPush = childrenActivityMap?.[activity.activityId] || [];
    processedData.push(...childrenToPush);
  });

  return processedData;
};

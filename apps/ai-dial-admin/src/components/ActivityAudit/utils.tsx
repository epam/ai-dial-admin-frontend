import { ColDef } from 'ag-grid-community';

import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getResourceRollbackOperation } from '@/src/constants/grid-columns/actions';
import { ACTIVITY_AUDIT_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { DialActivity } from '@/src/models/dial/activity-audit';
import { GridFilter } from '@/src/models/grid-filter';
import { FilterDto } from '@/src/models/request';
import { TimeRange } from '@/src/models/time-range';
import { FilterOperatorDto } from '@/src/types/request';
import { getOpenInNewTabOperation } from '@/src/constants/grid-columns/actions';
import { getRequestFilters } from '@/src/utils/request/get-request-filters';
import { ActivityAuditRevision } from './models';

/**
 * Generate columns with actions for activity audit grid
 *
 * @param {(activity: DialActivity) => void} open - open in new tab action
 * @param {(activity: DialActivity) => void} resourceRollback - rollback action
 * @returns {ColDef[]} - columns
 */
export const getActivityAuditColumns = (
  open: (activity: DialActivity) => void,
  resourceRollback: (activity: DialActivity) => void,
): ColDef[] => {
  const actions = [getOpenInNewTabOperation(open), getResourceRollbackOperation(resourceRollback)];
  return [...ACTIVITY_AUDIT_COLUMNS, ACTION_COLUMN(actions)];
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
 * Generate two digits number, adding start 0 if it < 10
 *
 * @param {number} num - number
 * @returns {string} - two digits string
 */
const sliceTwoDigits = (num: number): string => String(num).padStart(2, '0');

/**
 * Group revisions by date
 *
 * @param {ActivityAuditRevision[]} revisions - array of revisions
 * @returns {Record<string, ActivityAuditRevision[]>} - map of grouped revisions by date
 */
export const groupByDay = (revisions: ActivityAuditRevision[]): Record<string, ActivityAuditRevision[]> => {
  const todayKey = getTodayKey();

  return revisions.reduce(
    (acc, obj) => {
      const d = new Date(obj.timestamp);
      const key = `${sliceTwoDigits(d.getMonth() + 1)}.${sliceTwoDigits(d.getDate())}.${d.getFullYear()}`;

      const groupKey = key === todayKey ? 'Today' : key;

      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(obj);

      return acc;
    },
    {} as Record<string, ActivityAuditRevision[]>,
  );
};

/**
 * Generate dateTime from timestamp
 *
 * @param {number} ts - timestamp
 * @returns {string} - formatted string
 */
export const formatTimestamp = (ts: number): string => {
  const d = new Date(ts);
  return `${sliceTwoDigits(d.getMonth() + 1)}.${sliceTwoDigits(d.getDate())}.${d.getFullYear()} ${sliceTwoDigits(d.getHours())}:${sliceTwoDigits(d.getMinutes())}:${sliceTwoDigits(d.getSeconds())}`;
};

/**
 * Description placeholder
 *
 * @returns {string} - today date in given format
 */
export const getTodayKey = () => {
  const d = new Date();
  return `${sliceTwoDigits(d.getMonth() + 1)}.${sliceTwoDigits(d.getDate())}.${d.getFullYear()}`;
};

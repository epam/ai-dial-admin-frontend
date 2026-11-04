import { isEqual } from 'lodash';

import { ComparePeriod } from '@/src/components/Analytics/Usage/models';
import { DASHBOARD_EDIT_PARAM } from '@/src/constants/analytics/dashboards';
import { DEFAULT_TIME_PERIOD } from '@/src/constants/global-time-filter';
import { Dashboard, DashboardRequest, DashboardVisibility } from '@/src/models/analytics/dashboard';
import { SavedQueryTime, SavedQueryTimeMode } from '@/src/models/analytics/saved-query';
import { TimeFilterValue, TimeRange } from '@/src/models/time-range';
import { ApplicationRoute } from '@/src/types/routes';

/** A new dashboard opens empty, over the period the usage dashboard opens with, and private unless asked. */
export const newDashboardRequest = (
  name: string,
  description?: string,
  compare: ComparePeriod = ComparePeriod.Off,
  visibility: DashboardVisibility = DashboardVisibility.Private,
): DashboardRequest => ({
  name,
  description: description || undefined,
  visibility,
  time: { mode: SavedQueryTimeMode.Relative, period: DEFAULT_TIME_PERIOD },
  compare,
  widgets: [],
});

// A dashboard stored before it had a compare choice reads as Off, so opening it for edit is no change.
export const toDashboardRequest = ({
  name,
  description,
  visibility,
  time,
  compare,
  settings,
  widgets,
}: Dashboard): DashboardRequest => ({
  name,
  description,
  visibility,
  time,
  compare: compare ?? ComparePeriod.Off,
  ...(settings ? { settings } : {}),
  widgets,
});

/**
 * Whether a draft would write anything new. Compared as the payload, not as editor state, so the indicator
 * cannot disagree with what Save persists; absent and empty optional members count as the same value.
 */
export const isSameDashboardRequest = (a: DashboardRequest, b: DashboardRequest): boolean =>
  isEqual({ ...a, description: a.description || undefined }, { ...b, description: b.description || undefined });

/** The period selector's starting value for a stored time intent. */
export const toTimeFilterValue = (time?: SavedQueryTime): TimeFilterValue => {
  if (!time) return DEFAULT_TIME_PERIOD;
  if (time.mode === SavedQueryTimeMode.Relative) return time.period;
  return { startDate: new Date(time.from), endDate: new Date(time.to) };
};

/** The time intent a period selector state is stored as: its preset, or the custom range's two instants. */
export const toDashboardTime = (period: string, range: TimeRange, isCustom: boolean): SavedQueryTime =>
  isCustom
    ? { mode: SavedQueryTimeMode.Absolute, from: range.startDate.toISOString(), to: range.endDate.toISOString() }
    : { mode: SavedQueryTimeMode.Relative, period };

/** A custom dashboard's address, optionally opened straight in edit mode. */
export const getDashboardHref = (id: string, isEditing = false): string =>
  `${ApplicationRoute.Dashboard}/${encodeURIComponent(id)}${isEditing ? `?${DASHBOARD_EDIT_PARAM}=1` : ''}`;

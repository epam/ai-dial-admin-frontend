import { getIsAnalyticsEnabled } from '@/src/utils/env/get-analytics-toggle';
import { isValueTruthy } from '@/src/utils/types';

/**
 * Whether custom dashboards are served. They live on the analytics Dashboards page, so the flag counts only
 * while that page is the one `/dashboards` renders — the layout, both dashboard routes and the server
 * actions read this one function so none of them can disagree.
 */
export const getIsCustomDashboardsEnabled = (): boolean =>
  getIsAnalyticsEnabled() &&
  isValueTruthy(process.env.ANALYTICS_USAGE_ENABLED) &&
  isValueTruthy(process.env.ANALYTICS_CUSTOM_DASHBOARDS_ENABLED);

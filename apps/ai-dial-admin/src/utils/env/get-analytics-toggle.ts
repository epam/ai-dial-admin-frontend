import { isValueTruthy } from '@/src/utils/types';

/** Whether the Analytics section is enabled. The one reading of the flag, for the layout and the server alike. */
export const getIsAnalyticsEnabled = (): boolean => isValueTruthy(process.env.ANALYTICS_ENABLED);

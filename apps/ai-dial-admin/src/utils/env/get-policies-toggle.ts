import { isValueTruthy } from '@/src/utils/types';

/**
 * Whether the Policies and Policy Assignments pages are served. Off unless `POLICIES_ENABLED` is `true`:
 * Core stores these records but does not enforce them yet. The one reading of the flag, for the layout
 * and the four pages alike, so the menu never offers an address the route would refuse.
 */
export const getIsPoliciesEnabled = (): boolean => isValueTruthy(process.env.POLICIES_ENABLED);

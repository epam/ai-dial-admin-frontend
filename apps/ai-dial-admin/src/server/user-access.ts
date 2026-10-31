import { cookies, headers } from 'next/headers';
import { cache } from 'react';

import { coreUtilityApi } from '@/src/app/api/api';
import { AccessMode, AdminAccess, UserAccess } from '@/src/models/user-access';
import { errorObjLog } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { resolveUserAccess } from '@/src/utils/auth/user-access';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

/**
 * What the caller may do, from Core's `GET /v1/user/org-units`. Takes no argument so `cache` can dedupe on
 * the request: the layouts and `isFullAdminCaller` all ask, and Core is called once. A failed read counts as
 * denied — the cost is an affordance withheld, never a request the caller cannot make.
 */
export const getUserAccess = cache(async (): Promise<UserAccess> => {
  const isEnableAuth = getIsEnableAuthToggle();

  // Nothing is enforced with auth off, so there is nothing to ask Core.
  if (!isEnableAuth) return resolveUserAccess(isEnableAuth);

  try {
    const token = await getUserToken(isEnableAuth, headers(), cookies());

    return resolveUserAccess(isEnableAuth, await coreUtilityApi.getUserOrgUnits(token));
  } catch (e) {
    errorObjLog(e, 'Failed to read the caller access');
    return { mode: AccessMode.DENIED, adminAccess: AdminAccess.NONE, units: [] };
  }
});

/**
 * The server-side counterpart of `AppContext.isFullAdmin`, for a page that must decide on a request the
 * caller would only be refused.
 */
export async function isFullAdminCaller(): Promise<boolean> {
  return (await getUserAccess()).adminAccess === AdminAccess.FULL;
}

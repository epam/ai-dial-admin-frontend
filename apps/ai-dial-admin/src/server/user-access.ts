import { cookies, headers } from 'next/headers';

import { getUserInfo } from '@/src/app/api/api';
import { errorObjLog } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { resolveIsFullAdmin } from '@/src/utils/auth/full-admin';
import { getIsAdminApiEnabled } from '@/src/utils/env/get-admin-api-toggle';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

/**
 * The server-side counterpart of `AppContext.isFullAdmin`, for a page that must decide on a request the
 * caller would only be refused. A failed identity read counts as not a full admin: the cost is an affordance
 * withheld, never a request the caller cannot make.
 */
export async function isFullAdminCaller(): Promise<boolean> {
  const isAdminApiEnabled = getIsAdminApiEnabled();
  const isEnableAuth = getIsEnableAuthToggle();

  // Nothing to read when no role is enforced; the shared rule answers without one.
  if (!isAdminApiEnabled || !isEnableAuth) return resolveIsFullAdmin(isAdminApiEnabled, isEnableAuth);

  try {
    const token = await getUserToken(isEnableAuth, headers(), cookies());
    const roles = (await getUserInfo(token)).response?.userInfo?.roles;

    return resolveIsFullAdmin(isAdminApiEnabled, isEnableAuth, roles);
  } catch (e) {
    errorObjLog(e, 'Failed to resolve the caller roles');
    return false;
  }
}

import { CoreUserOrgUnitsResponse } from '@/src/models/dial/core-user-org-units';
import { ServerActionResponse } from '@/src/models/server-action';
import { AccessMode, AdminAccess, UserAccess } from '@/src/models/user-access';
import { canReadNamespace } from '@/src/utils/org-units/access';
import { ROUTABLE_NAMESPACES } from '@/src/utils/org-units/namespaces';

const NOT_FOUND = 404;

const FULL_ACCESS: UserAccess = { mode: AccessMode.FULL, adminAccess: AdminAccess.FULL, units: [] };
const DENIED_ACCESS: UserAccess = { mode: AccessMode.DENIED, adminAccess: AdminAccess.NONE, units: [] };

/**
 * Turns Core's answer to `GET /v1/user/role-assignments` into what the panel acts on. Shared by the client context
 * and the server, so the two never disagree about who a full admin is.
 *
 * With auth off nothing is enforced and Core is not asked (`result` is undefined). A 404 means org units are
 * off, so Core gives no admin signal and still refuses real calls itself — both count as a full admin.
 *
 * Unit mode needs a unit that lets the caller read a section the panel shows. A caller whose only role is `member`
 * holds `org-units: read` alone, so there is nothing to show and they are denied.
 */
export const resolveUserAccess = (
  isEnableAuth: boolean,
  result?: ServerActionResponse<CoreUserOrgUnitsResponse>,
): UserAccess => {
  if (!isEnableAuth || result?.status === NOT_FOUND) return FULL_ACCESS;
  if (!result?.success || !result.response) return DENIED_ACCESS;

  const { adminAccess, items } = result.response;
  const units = items ?? [];

  if (adminAccess === AdminAccess.FULL || adminAccess === AdminAccess.READ_ONLY) {
    return { mode: AccessMode.FULL, adminAccess, units };
  }
  if (ROUTABLE_NAMESPACES.some((namespace) => canReadNamespace(units, namespace))) {
    return { mode: AccessMode.UNIT, adminAccess, units };
  }

  return { ...DENIED_ACCESS, adminAccess };
};

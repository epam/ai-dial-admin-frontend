import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { rolesApi } from '@/src/app/api/api';
import RolesList from '@/src/components/RolesList/RolesList';
import { DialRole } from '@/src/models/dial/role';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { SIGN_IN_LINK } from '@/src/constants/auth';
import { logger } from '@/src/server/logger';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let data: DialRole[] = [];

  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  try {
    data = (await rolesApi.getRolesList(token)) || [];
  } catch (e) {
    logger.error('Getting roles error', e);
  }

  return <RolesList data={data || []} />;
}

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { addonsApi } from '@/src/app/api/api';
import AddonsList from '@/src/components/AddonsList/AddonsList';
import { DialAddon } from '@/src/models/dial/addon';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { SIGN_IN_LINK } from '@/src/constants/auth';
import { logger } from '@/src/server/logger';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let data: DialAddon[] = [];

  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  try {
    data = (await addonsApi.getAddonsList(token)) || [];
  } catch (e) {
    logger.error('Getting addons error', e);
  }

  return <AddonsList data={data || []} />;
}

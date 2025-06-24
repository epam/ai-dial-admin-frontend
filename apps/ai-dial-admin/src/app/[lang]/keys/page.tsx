import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { keysApi } from '@/src/app/api/api';
import KeysList from '@/src/components/KeysList/KeysList';
import { DialKey } from '@/src/models/dial/key';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { SIGN_IN_LINK } from '@/src/constants/auth';
import { logger } from '@/src/server/logger';
import Page403 from '@/src/components/Page403/Page403';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }
  let data: DialKey[] | null = [];

  try {
    data = await keysApi.getKeysList(token);
    if (data === void 0) {
      return <Page403 />;
    }
  } catch (e) {
    logger.error('Getting keys error', e);
  }

  return <KeysList data={data || []} />;
}

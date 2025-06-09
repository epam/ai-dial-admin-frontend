import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { adaptersApi } from '@/src/app/api/api';
import AdaptersList from '@/src/components/AdaptersList/AdaptersList';
import { SIGN_IN_LINK } from '@/src/constants/auth';
import { DialAdapter } from '@/src/models/dial/adapter';
import { logger } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let data: DialAdapter[] = [];

  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  try {
    data = (await adaptersApi.getAdaptersList(token)) || [];
  } catch (e) {
    logger.error('Getting adapters error', e);
  }

  return <AdaptersList data={data || []} />;
}

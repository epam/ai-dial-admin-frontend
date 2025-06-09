import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { applicationsApi, applicationRunnersApi } from '@/src/app/api/api';
import ApplicationsList from '@/src/components/ApplicationsList/ApplicationsList';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { SIGN_IN_LINK } from '@/src/constants/auth';
import { logger } from '@/src/server/logger';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  let data: DialApplication[] = [];
  let runners: DialApplicationScheme[] = [];

  try {
    data = (await applicationsApi.getApplicationsList(token)) || [];
    runners = (await applicationRunnersApi.getApplicationSchemesList(token)) || [];
  } catch (e) {
    logger.error('Getting applications error', e);
  }

  return <ApplicationsList data={data || []} runners={runners} />;
}

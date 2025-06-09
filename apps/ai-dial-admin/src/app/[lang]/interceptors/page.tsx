import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import InterceptorsList from '@/src/components/InterceptorsList/InterceptorsList';
import { interceptorsApi } from '@/src/app/api/api';
import { DialInterceptor } from '@/src/models/dial/interceptor';
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

  let data: DialInterceptor[] = [];

  try {
    data = (await interceptorsApi.getInterceptorsList(token)) || [];
  } catch (e) {
    logger.error('Getting interceptor error', e);
  }

  return <InterceptorsList data={data || []} />;
}

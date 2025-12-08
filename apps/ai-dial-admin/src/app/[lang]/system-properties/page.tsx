import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { interceptorsApi, utilityApi } from '@/src/app/api/api';
import Page403 from '@/src/components/Page403/Page403';
import SystemProperties from '@/src/components/SystemProperties/SystemProperties';
import { SIGN_IN_LINK } from '@/src/constants/auth';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { logError } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { GlobalSettings } from '@/src/models/system-properties';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  let interceptors: DialInterceptor[] | null = [];
  let globalSettings: GlobalSettings | null = null;
  let etag = DEFAULT_ETAG;

  try {
    interceptors = await interceptorsApi.getInterceptorsList(token);
    globalSettings = await utilityApi.getSystemProperties(token, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as GlobalSettings;
    });

    if (interceptors === void 0) {
      return <Page403 />;
    }
  } catch (e) {
    logError(e, 'Failed to fetch interceptors view data');
  }

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  return <SystemProperties interceptors={interceptors || []} globalSettings={globalSettings} etag={etag} />;
}

import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { interceptorsApi, utilityApi } from '@/src/app/api/api';
import SystemProperties from '@/src/components/SystemProperties/SystemProperties';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { GlobalSettings } from '@/src/models/system-properties';
import { errorObjLog } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let interceptors: DialInterceptor[] | null = [];
  let globalSettings: GlobalSettings | null = null;
  let etag = DEFAULT_ETAG;

  try {
    interceptors = await interceptorsApi.getInterceptorsList(token);
    globalSettings = await utilityApi.getSystemProperties(token, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as GlobalSettings;
    });
  } catch (e) {
    errorObjLog(e, 'Failed to fetch interceptors view data');
  }

  if (globalSettings == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <SystemProperties interceptors={interceptors || []} globalSettings={globalSettings} etag={etag} />
    </SaveValidationContextProvider>
  );
}

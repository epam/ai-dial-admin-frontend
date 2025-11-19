import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { interceptorsApi } from '@/src/app/api/api';
import InterceptorsList from '@/src/components/Interceptors/List/List';
import Page403 from '@/src/components/Page403/Page403';
import { SIGN_IN_LINK } from '@/src/constants/auth';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { logError } from '@/src/server/logger';
import { InterceptorStatus } from '@/src/types/interceptor-status';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  let data: DialInterceptor[] | null = [];
  let global: string[] | null = [];

  try {
    data = await interceptorsApi.getInterceptorsList(token);
    // todo fill when api ready
    global = [];
    if (data === void 0) {
      return <Page403 />;
    }
    data =
      data?.map((item) => ({
        ...item,
        status: global?.includes(item.name as string) ? InterceptorStatus.GLOBAL : InterceptorStatus.LOCAL,
      })) || [];
  } catch (e) {
    logError(e, 'Failed to fetch interceptor data');
  }

  return (
    <SaveValidationContextProvider>
      <InterceptorsList data={data || []} />
    </SaveValidationContextProvider>
  );
}

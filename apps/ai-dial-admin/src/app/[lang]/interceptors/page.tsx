import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { interceptorsApi, utilityApi } from '@/src/app/api/api';
import InterceptorsList from '@/src/components/Interceptors/List/List';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { errorObjLog } from '@/src/server/logger';
import { InterceptorStatus } from '@/src/types/interceptor-status';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let data: DialInterceptor[] | null = null;
  let global: string[] | null = [];

  try {
    data = await interceptorsApi.getInterceptorsList(token);
    global = (await utilityApi.getSystemProperties(token, DEFAULT_ETAG)).response?.globalInterceptors || [];
    data =
      data?.map((item) => ({
        ...item,
        status: global?.includes(item.name as string) ? InterceptorStatus.GLOBAL : InterceptorStatus.LOCAL,
      })) || [];
  } catch (e) {
    errorObjLog(e, 'Failed to fetch interceptor data');
  }

  if (data == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <InterceptorsList data={data || []} />
    </SaveValidationContextProvider>
  );
}

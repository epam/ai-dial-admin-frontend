import { cookies, headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { ApplicationRoute } from '@/src/types/routes';

import { routesApi } from '@/src/app/api/api';
import RoutesList from '@/src/components/Routes/List/RoutesList';
import { DialRoute } from '@/src/models/dial/route';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { errorObjLog } from '@/src/server/logger';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  if (!process.env.DIAL_ADMIN_API_URL) {
    redirect(ApplicationRoute.Home);
  }
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let data: DialRoute[] | null = null;

  try {
    data = await routesApi.getRoutesList(token);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch routes view data');
  }

  if (data == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <RoutesList data={data || []} />
    </SaveValidationContextProvider>
  );
}

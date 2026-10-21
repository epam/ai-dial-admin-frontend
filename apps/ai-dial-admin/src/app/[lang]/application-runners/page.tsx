import { cookies, headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { ApplicationRoute } from '@/src/types/routes';

import { applicationRunnersApi } from '@/src/app/api/api';
import ApplicationRunnersList from '@/src/components/ApplicationRunners/List/List';
import { DialApplicationScheme } from '@/src/models/dial/application';
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

  let data: DialApplicationScheme[] | null = null;

  try {
    data = await applicationRunnersApi.getApplicationSchemesList(token);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch application runners data');
  }

  if (data == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <ApplicationRunnersList data={data || []} />
    </SaveValidationContextProvider>
  );
}

import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { applicationRunnersApi, applicationsApi } from '@/src/app/api/api';
import ApplicationsList from '@/src/components/Applications/List/List';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { errorObjLog } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let data: DialApplication[] | null = null;
  let runners: DialApplicationScheme[] | null = [];

  try {
    data = await applicationsApi.getApplicationsList(token);
    runners = await applicationRunnersApi.getApplicationSchemesList(token);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch applications data');
  }

  if (data == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <ApplicationsList data={data || []} runners={runners || []} />
    </SaveValidationContextProvider>
  );
}

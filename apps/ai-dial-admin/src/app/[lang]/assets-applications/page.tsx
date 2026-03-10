import { cookies, headers } from 'next/headers';

import { applicationRunnersApi } from '@/src/app/api/api';
import AppsList from '@/src/components/Assets/Apps/List';
import { AppsFolderProvider } from '@/src/context/assets/AppsFolderContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { errorObjLog } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let runners: DialApplicationScheme[] | null = [];

  try {
    runners = await applicationRunnersApi.getApplicationSchemesList(token);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch applications data');
  }

  return (
    <SaveValidationContextProvider>
      <AppsFolderProvider>
        <AppsList runners={runners || []} />
      </AppsFolderProvider>
    </SaveValidationContextProvider>
  );
}

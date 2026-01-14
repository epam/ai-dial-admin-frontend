import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import AppsList from '@/src/components/Assets/Apps/List';
import { SIGN_IN_LINK } from '@/src/constants/auth';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { AppsFolderProvider } from '@/src/context/assets/AppsFolderContext';
import { DialApplicationScheme } from '@/src/models/dial/application';
import Page403 from '@/src/components/Page403/Page403';
import { errorObjLog } from '@/src/server/logger';
import { applicationRunnersApi } from '@/src/app/api/api';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  let runners: DialApplicationScheme[] | null = [];

  try {
    runners = await applicationRunnersApi.getApplicationSchemesList(token);
    if (runners === void 0) {
      return <Page403 />;
    }
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

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { applicationRunnersApi } from '@/src/app/api/api';
import ApplicationRunnersList from '@/src/components/ApplicationRunners/List/List';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { SIGN_IN_LINK } from '@/src/constants/auth';
import { logError } from '@/src/server/logger';
import Page403 from '@/src/components/Page403/Page403';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  let data: DialApplicationScheme[] | null = [];

  try {
    data = await applicationRunnersApi.getApplicationSchemesList(token);
    if (data === void 0) {
      return <Page403 />;
    }
  } catch (e) {
    logError(e, 'Failed to fetch application runners data');
  }

  return (
    <SaveValidationContextProvider>
      <ApplicationRunnersList data={data || []} />
    </SaveValidationContextProvider>
  );
}

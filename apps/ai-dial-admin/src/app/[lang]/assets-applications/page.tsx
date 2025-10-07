import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import AppsList from '@/src/components/Assets/Apps/List/List';
import { SIGN_IN_LINK } from '@/src/constants/auth';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { AppsFolderProvider } from '@/src/context/assets/AppsFolderContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  return (
    <SaveValidationContextProvider>
      <AppsFolderProvider>
        <AppsList />
      </AppsFolderProvider>
    </SaveValidationContextProvider>
  );
}

import { cookies, headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { ApplicationRoute } from '@/src/types/routes';

import { keysApi } from '@/src/app/api/api';
import KeysList from '@/src/components/Keys/List/List';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialKey } from '@/src/models/dial/key';
import { errorObjLog } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page() {
  if (!process.env.DIAL_ADMIN_API_URL) {
    redirect(ApplicationRoute.Home);
  }
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let data: DialKey[] | null = null;

  try {
    data = await keysApi.getKeysList(token);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch keys view data');
  }

  if (data == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <KeysList data={data || []} />
    </SaveValidationContextProvider>
  );
}

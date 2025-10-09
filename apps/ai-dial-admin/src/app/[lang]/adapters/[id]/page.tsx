import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { adaptersApi } from '@/src/app/api/api';
import { DialAdapter } from '@/src/models/dial/adapter';
import { logError } from '@/src/server/logger';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import AdapterView from '@/src/components/Adapter/View/AdapterView';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let adapter: DialAdapter | null = null;

  try {
    adapter = await adaptersApi.getAdapter((await params.params).id, token);
  } catch (e) {
    logError(e, 'Failed to fetch adapter view data');
  }

  if (adapter == null) {
    redirect(ApplicationRoute.Adapters);
  }

  return (
    <SaveValidationContextProvider>
      <AdapterView originalAdapter={adapter} />
    </SaveValidationContextProvider>
  );
}

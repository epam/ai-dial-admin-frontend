import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { adaptersApi } from '@/src/app/api/api';
import AdaptersList from '@/src/components/Adapter/List/AdaptersList';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialAdapter } from '@/src/models/dial/adapter';
import { errorObjLog } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let data: DialAdapter[] | null = null;

  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  try {
    data = await adaptersApi.getAdaptersList(token);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch adapters data');
  }

  if (data == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <AdaptersList data={data || []} />
    </SaveValidationContextProvider>
  );
}

import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { modelsApi } from '@/src/app/api/api';
import ModelsList from '@/src/components/Models/List/List';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialModel } from '@/src/models/dial/model';
import { errorObjLog } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let data: DialModel[] | null = null;

  try {
    data = await modelsApi.getModelsList(token);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch models view data');
  }

  if (data == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <ModelsList data={data || []} />
    </SaveValidationContextProvider>
  );
}

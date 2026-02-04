import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { adaptersApi, modelsApi } from '@/src/app/api/api';
import AdapterView from '@/src/components/Adapter/View/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialModel } from '@/src/models/dial/model';
import { errorObjLog } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { filterDisplayNames } from '@/src/utils/entities/filter-names';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let etag = DEFAULT_ETAG;
  let adapter: DialAdapter | null = null;
  let models: DialModel[] | null = null;

  try {
    adapter = await adaptersApi.getAdapter((await params.params).id, token, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as DialAdapter | null;
    });
    models = await modelsApi.getModelsList(token);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch adapter view data');
  }

  if (adapter == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <AdapterView originalAdapter={adapter} etag={etag} modelsNames={filterDisplayNames(models)} />
    </SaveValidationContextProvider>
  );
}

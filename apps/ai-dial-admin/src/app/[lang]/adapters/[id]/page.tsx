import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { adaptersApi, modelsApi } from '@/src/app/api/api';
import { DialAdapter } from '@/src/models/dial/adapter';
import { errorObjLog } from '@/src/server/logger';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import AdapterView from '@/src/components/Adapter/View/AdapterView';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { filterDisplayNames } from '@/src/utils/entities/filter-names';
import { DialModel } from '@/src/models/dial/model';

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
    redirect(ApplicationRoute.Adapters);
  }

  return (
    <SaveValidationContextProvider>
      <AdapterView originalAdapter={adapter} etag={etag} modelsNames={filterDisplayNames(models)} />
    </SaveValidationContextProvider>
  );
}

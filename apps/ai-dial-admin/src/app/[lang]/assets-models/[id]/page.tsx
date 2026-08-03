import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { interceptorsApi, rolesApi } from '@/src/app/api/api';
import ModelView from '@/src/components/Assets/Models/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { AssetModel } from '@/src/models/dial/deployment-asset';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialRole } from '@/src/models/dial/role';
import { errorObjLog } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getModel } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ path: string }>;
}) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let etag = DEFAULT_ETAG;
  let model: AssetModel | null = null;
  let roles: DialRole[] | null = [];
  let interceptors: DialInterceptor[] | null = [];

  try {
    // Next already decodes the query param once, which restores the resource name `ResourceInfo.path`
    // carries. Decoding again would corrupt any name containing a percent sign.
    const path = (await params.searchParams).path;

    model = await getModel(path, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as AssetModel | null;
    });
    roles = (await rolesApi.getRolesList(token)) || [];
    // Core's interceptor listing is blob-only, so it would not see interceptors published through the
    // aggregated config — the selectable list still comes from the admin BE.
    interceptors = (await interceptorsApi.getInterceptorsList(token)) || [];
  } catch (e) {
    errorObjLog(e, 'Failed to fetch model view data');
  }
  if (model == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <ModelView etag={etag} originalModel={model} roles={roles || []} interceptors={interceptors || []} />
    </SaveValidationContextProvider>
  );
}

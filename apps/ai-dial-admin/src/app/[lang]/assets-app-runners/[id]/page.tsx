import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { interceptorsApi, rolesApi } from '@/src/app/api/api';
import AppRunnerAssetView from '@/src/components/Assets/AppRunners/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialAppRunnerResource } from '@/src/models/dial/resource';
import { DialRole } from '@/src/models/dial/role';
import { errorObjLog } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getRunner } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ path: string }>;
}) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let etag = DEFAULT_ETAG;
  let runner: DialAppRunnerResource | null = null;
  let roles: DialRole[] | null = [];
  let interceptors: DialInterceptor[] | null = [];

  try {
    // Next already decodes the query param once, which restores the singly-encoded resource name
    // `ResourceInfo.path` carries. Decoding again would expose the `$id`'s `:` and `/`, and
    // `encodeCorePath` would then split it into path segments instead of one resource name.
    const path = (await params.searchParams).path;

    runner = await getRunner(path, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as DialAppRunnerResource | null;
    });
    roles = (await rolesApi.getRolesList(token)) || [];
    // Core's interceptor listing is blob-only, so it would not see interceptors published through
    // the aggregated config — the selectable list still comes from the admin BE.
    interceptors = (await interceptorsApi.getInterceptorsList(token)) || [];
  } catch (e) {
    errorObjLog(e, 'Failed to fetch app runner asset data');
  }

  if (runner == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <AppRunnerAssetView etag={etag} originalRunner={runner} roles={roles || []} interceptors={interceptors || []} />
    </SaveValidationContextProvider>
  );
}

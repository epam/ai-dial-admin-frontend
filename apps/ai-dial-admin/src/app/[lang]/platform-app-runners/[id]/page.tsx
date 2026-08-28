import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import AppRunnerAssetView from '@/src/components/Assets/Platform/AppRunners/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialAppRunnerResource } from '@/src/models/dial/resource';
import { DialRole } from '@/src/models/dial/role';
import { readConfigEntities, readGlobalInterceptors } from '@/src/server/config-entities/read-page-options';
import { errorObjLog } from '@/src/server/logger';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
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
  const optionWarnings: EntitiesI18nKey[] = [];

  try {
    // Next already decodes the query param once, which restores the singly-encoded resource name
    // `ResourceInfo.path` carries. Decoding again would expose the `$id`'s `:` and `/`, and
    // `encodeCorePath` would then split it into path segments instead of one resource name.
    const path = (await params.searchParams).path;

    runner = await getRunner(path, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as DialAppRunnerResource | null;
    });
  } catch (e) {
    errorObjLog(e, 'Failed to fetch app runner asset data');
  }

  // Deliberately outside the resource fetch's try, and resolved together: an option-list problem must
  // not prevent the runner from loading, and one list failing must not skip the others.
  const [roles, interceptors, globalInterceptors] = await Promise.all([
    readConfigEntities<DialRole>(token, ConfigFileEntityType.Roles, optionWarnings),
    readConfigEntities<DialInterceptor>(token, ConfigFileEntityType.Interceptors, optionWarnings),
    readGlobalInterceptors(token, optionWarnings),
  ]);

  if (runner == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <AppRunnerAssetView
        etag={etag}
        originalRunner={runner}
        roles={roles}
        interceptors={interceptors}
        globalInterceptors={globalInterceptors}
        optionWarnings={optionWarnings}
      />
    </SaveValidationContextProvider>
  );
}

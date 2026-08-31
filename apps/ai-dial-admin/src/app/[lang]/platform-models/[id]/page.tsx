import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import ModelView from '@/src/components/Assets/Platform/Models/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { AssetModel } from '@/src/models/dial/deployment-asset';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialRole } from '@/src/models/dial/role';
import { readConfigEntities, readGlobalInterceptors } from '@/src/server/config-entities/read-page-options';
import { errorObjLog } from '@/src/server/logger';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
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
  const optionWarnings: EntitiesI18nKey[] = [];

  try {
    // Next already decodes the query param once, which restores the resource name `ResourceInfo.path`
    // carries. Decoding again would corrupt any name containing a percent sign.
    const path = (await params.searchParams).path;

    model = await getModel(path, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as AssetModel | null;
    });
  } catch (e) {
    errorObjLog(e, 'Failed to fetch model view data');
  }

  // Deliberately outside the resource fetch's try, and resolved together: an option-list problem must
  // not prevent the model from loading, and one list failing must not skip another. Core-direct —
  // matching Assets > App Runners — rather than the admin-BE list, which cannot see roles/interceptors
  // declared in Core's configuration file, and which is a different population from `Assets > Roles`/
  // `Assets > Interceptors`' own API-written one.
  const [roles, interceptors, globalInterceptors] = await Promise.all([
    readConfigEntities<DialRole>(token, ConfigFileEntityType.Roles, optionWarnings),
    readConfigEntities<DialInterceptor>(token, ConfigFileEntityType.Interceptors, optionWarnings),
    readGlobalInterceptors(token, optionWarnings),
  ]);

  if (model == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <ModelView
        etag={etag}
        originalModel={model}
        roles={roles}
        interceptors={interceptors}
        globalInterceptors={globalInterceptors}
        optionWarnings={optionWarnings}
      />
    </SaveValidationContextProvider>
  );
}

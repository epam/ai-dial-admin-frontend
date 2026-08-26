import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import RouteAssetView from '@/src/components/Assets/Routes/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialRole } from '@/src/models/dial/role';
import { DialRouteResource } from '@/src/models/dial/resource';
import { readConfigEntities } from '@/src/server/config-entities/read-page-options';
import { errorObjLog } from '@/src/server/logger';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getRoute } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ path: string }>;
}) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let etag = DEFAULT_ETAG;
  let route: DialRouteResource | null = null;
  const optionWarnings: EntitiesI18nKey[] = [];

  try {
    // Next already decodes the query param once, which restores the resource name `ResourceInfo.path`
    // carries. Decoding again would corrupt any name containing a percent sign.
    const path = (await params.searchParams).path;

    route = await getRoute(path, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as DialRouteResource | null;
    });
  } catch (e) {
    errorObjLog(e, 'Failed to fetch route asset data');
  }

  // Deliberately outside the resource fetch's try, and resolved after: an option-list problem must
  // not prevent the route from loading. Core-direct — matching Assets > Models/App Runners — rather
  // than the admin-BE list, which cannot see roles declared in Core's configuration file, and which
  // is a different population from `Assets > Roles`' own API-written one.
  const roles = await readConfigEntities<DialRole>(token, ConfigFileEntityType.Roles, optionWarnings);

  if (route == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <RouteAssetView etag={etag} originalRoute={route} roles={roles} optionWarnings={optionWarnings} />
    </SaveValidationContextProvider>
  );
}

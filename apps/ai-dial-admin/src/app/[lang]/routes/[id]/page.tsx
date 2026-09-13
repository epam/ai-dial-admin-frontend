import { cookies, headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { ApplicationRoute } from '@/src/types/routes';

import { rolesApi, routesApi } from '@/src/app/api/api';
import { getConfigFileRoute } from '@/src/app/[lang]/routes/actions';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialRole } from '@/src/models/dial/role';
import { DialRoute } from '@/src/models/dial/route';
import { readConfigEntities } from '@/src/server/config-entities/read-page-options';
import { errorObjLog } from '@/src/server/logger';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { filterNames } from '@/src/utils/entities/filter-names';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import RouteView from '@/src/components/Routes/View/View';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ configFile?: string }>;
}) {
  const isConfigFileMode = (await params.searchParams).configFile === 'true';

  if (!process.env.DIAL_ADMIN_API_URL && !isConfigFileMode) {
    redirect(ApplicationRoute.Home);
  }
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let etag = DEFAULT_ETAG;
  let routes: DialRoute[] | null = [];
  let route: DialRoute | null = null;
  let roles: DialRole[] | null = [];
  try {
    const id = (await params.params).id;

    if (isConfigFileMode) {
      const result = await getConfigFileRoute(id);
      route = result.success ? (result.data as DialRoute) : null;
      routes = route ? [route] : [];
      roles = await readConfigEntities<DialRole>(token, ConfigFileEntityType.Roles, [], true);
    } else {
      routes = (await routesApi.getRoutesList(token)) || [];
      route = await routesApi.getRoute(id, token, etag).then((res) => {
        etag = res?.etag || DEFAULT_ETAG;
        return res?.response as DialRoute | null;
      });
      roles = (await rolesApi.getRolesList(token)) || [];
    }
  } catch (e) {
    errorObjLog(e, 'Failed to fetch route view data');
  }

  if (route == null) {
    notFound();
  }

  const names = filterNames(routes, route?.name);

  return (
    <SaveValidationContextProvider>
      <RouteView originalRoute={route} names={names} etag={etag} roles={roles} isConfigFileSource={isConfigFileMode} />
    </SaveValidationContextProvider>
  );
}

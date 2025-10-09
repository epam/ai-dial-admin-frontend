import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { rolesApi, routesApi } from '@/src/app/api/api';
import EntityView from '@/src/components/EntityView/View/EntityView';
import { DialRoute } from '@/src/models/dial/route';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { removeRoute, updateRoute } from '../actions';
import { DialRole } from '@/src/models/dial/role';
import { logError } from '@/src/server/logger';
import Page403 from '@/src/components/Page403/Page403';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { filterNames } from '@/src/utils/entities/filter-names';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let routes: DialRoute[] | null = [];
  let route: DialRoute | null = null;
  let roles: DialRole[] | null = [];
  try {
    routes = (await routesApi.getRoutesList(token)) || [];
    route = await routesApi.getRoute((await params.params).id, token);
    roles = (await rolesApi.getRolesList(token)) || [];

    if (routes === void 0 || route === void 0 || roles === void 0) {
      return <Page403 />;
    }
  } catch (e) {
    logError(e, 'Failed to fetch route view data');
  }

  if (route == null) {
    redirect(ApplicationRoute.Routes);
  }

  const names = filterNames(routes, route?.name);

  return (
    <SaveValidationContextProvider>
      <EntityView
        view={ApplicationRoute.Routes}
        names={names}
        originalEntity={route}
        roles={roles}
        removeEntity={removeRoute}
        updateEntity={updateRoute}
      />
    </SaveValidationContextProvider>
  );
}

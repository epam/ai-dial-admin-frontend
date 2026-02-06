import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { rolesApi, routesApi } from '@/src/app/api/api';
import EntityView from '@/src/components/EntityView/View/EntityView';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialRole } from '@/src/models/dial/role';
import { DialRoute } from '@/src/models/dial/route';
import { errorObjLog } from '@/src/server/logger';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { filterNames } from '@/src/utils/entities/filter-names';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getCoreRoute, removeRoute, updateCoreRoute, updateRoute } from '../actions';
import RouteView from '../../../../components/Routes/View/View';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let etag = DEFAULT_ETAG;
  let routes: DialRoute[] | null = [];
  let route: DialRoute | null = null;
  let roles: DialRole[] | null = [];
  try {
    routes = (await routesApi.getRoutesList(token)) || [];
    route = await routesApi.getRoute((await params.params).id, token, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as DialRoute | null;
    });
    roles = (await rolesApi.getRolesList(token)) || [];
  } catch (e) {
    errorObjLog(e, 'Failed to fetch route view data');
  }

  if (route == null) {
    notFound();
  }

  const names = filterNames(routes, route?.name);

  return (
    <SaveValidationContextProvider>
      <RouteView originalRoute={route} names={names} etag={etag} roles={roles} />
    </SaveValidationContextProvider>
  );
}

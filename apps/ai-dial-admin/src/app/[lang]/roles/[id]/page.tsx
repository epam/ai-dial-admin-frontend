import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { applicationsApi, keysApi, rolesApi, routesApi, toolSetsApi } from '@/src/app/api/api';
import RolesView from '@/src/components/Roles/View/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { getModelsList } from '@/src/app/[lang]/models/actions';
import { DialApplication } from '@/src/models/dial/application';
import { DialKey } from '@/src/models/dial/key';
import { DialModel } from '@/src/models/dial/model';
import { DialRole } from '@/src/models/dial/role';
import { DialRoute } from '@/src/models/dial/route';
import { Toolset } from '@/src/models/dial/toolset';
import { errorObjLog } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { filterNames } from '@/src/utils/entities/filter-names';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let etag = DEFAULT_ETAG;
  let roles: DialRole[] | null = [];
  let role: DialRole | null = null;

  let models: DialModel[] | null = [];
  let applications: DialApplication[] | null = [];
  let toolsets: Toolset[] | null = [];
  let routes: DialRoute[] | null = [];
  let keys: DialKey[] | null = [];

  try {
    roles = await rolesApi.getRolesList(token);
    models = await getModelsList();
    keys = await keysApi.getKeysList(token);
    applications = await applicationsApi.getApplicationsList(token);
    toolsets = await toolSetsApi.getToolsetList(token);
    routes = await routesApi.getRoutesList(token);
    role = await rolesApi.getRole((await params.params).id, token, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as DialApplication | null;
    });
  } catch (e) {
    errorObjLog(e, 'Failed to fetch role view data');
  }

  if (role == null) {
    notFound();
  }

  const names = filterNames(roles, role?.name);

  return (
    <SaveValidationContextProvider>
      <RolesView
        names={names}
        originalRole={role}
        models={models || []}
        applications={applications || []}
        toolsets={toolsets || []}
        routes={routes || []}
        keys={keys || []}
        etag={etag}
      />
    </SaveValidationContextProvider>
  );
}

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { applicationsApi, keysApi, modelsApi, rolesApi } from '@/src/app/api/api';
import RolesView from '@/src/components/Roles/View/View';
import { DialApplication } from '@/src/models/dial/application';
import { DialModel } from '@/src/models/dial/model';
import { DialRole } from '@/src/models/dial/role';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { DialKey } from '@/src/models/dial/key';
import { logError } from '@/src/server/logger';
import Page403 from '@/src/components/Page403/Page403';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { filterNames } from '@/src/utils/entities/filter-names';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let roles: DialRole[] | null = [];
  let role: DialRole | null = null;

  let models: DialModel[] | null = [];
  let applications: DialApplication[] | null = [];
  let keys: DialKey[] | null = [];

  try {
    roles = await rolesApi.getRolesList(token);
    models = await modelsApi.getModelsList(token);
    keys = await keysApi.getKeysList(token);
    applications = await applicationsApi.getApplicationsList(token);

    role = await rolesApi.getRole((await params.params).id, token);

    if (roles === void 0 || models === void 0 || keys === void 0 || applications === void 0 || role === void 0) {
      return <Page403 />;
    }
  } catch (e) {
    logError(e, 'Failed to fetch role view data');
  }

  if (role == null) {
    redirect(ApplicationRoute.Roles);
  }

  const names = filterNames(roles, role?.name);

  return (
    <SaveValidationContextProvider>
      <RolesView
        names={names}
        originalRole={role}
        models={models || []}
        applications={applications || []}
        keys={keys || []}
      />
    </SaveValidationContextProvider>
  );
}

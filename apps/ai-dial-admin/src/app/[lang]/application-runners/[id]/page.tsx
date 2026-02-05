import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { applicationRunnersApi, applicationsApi, interceptorsApi, rolesApi } from '@/src/app/api/api';
import ApplicationRunnersView from '@/src/components/ApplicationRunners/View/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { AppsFolderProvider } from '@/src/context/assets/AppsFolderContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialRole } from '@/src/models/dial/role';
import { errorObjLog } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { filterDisplayNames } from '@/src/utils/entities/filter-names';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { DialInterceptor } from '@/src/models/dial/interceptor';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let etag = DEFAULT_ETAG;
  let applicationScheme: DialApplicationScheme | null | undefined = null;
  let roles: DialRole[] | null = [];
  let applications: DialApplication[] | null = [];
  let interceptors: DialInterceptor[] | null = [];

  try {
    const id = decodeURIComponent((await params.params).id);
    applicationScheme = await applicationRunnersApi.getApplicationScheme(id, token, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as DialApplicationScheme | null;
    });
    roles = (await rolesApi.getRolesList(token)) || [];
    applications = await applicationsApi.getApplicationsList(token);
    interceptors = (await interceptorsApi.getInterceptorsList(token)) || [];
  } catch (e) {
    errorObjLog(e, 'Failed to fetch application runner data');
  }

  if (applicationScheme == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <AppsFolderProvider>
        <ApplicationRunnersView
          etag={etag}
          originalScheme={applicationScheme}
          roles={roles}
          names={filterDisplayNames(applications)}
          interceptors={interceptors}
        />
      </AppsFolderProvider>
    </SaveValidationContextProvider>
  );
}

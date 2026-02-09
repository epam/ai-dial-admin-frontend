import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { applicationRunnersApi, applicationsApi, interceptorsApi, modelsApi, rolesApi } from '@/src/app/api/api';
import ApplicationView from '@/src/components/Applications/View/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { DialRole } from '@/src/models/dial/role';
import { errorObjLog } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { filterDisplayNamesWithVersions } from '@/src/utils/entities/filter-names';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let etag = DEFAULT_ETAG;
  let models: DialModel[] | null = [];
  let applications: DialApplication[] | null = [];
  let application: DialApplication | null = null;
  let applicationSchemes: DialApplicationScheme[] | null = [];

  let roles: DialRole[] | null = [];
  let interceptors: DialInterceptor[] | null = [];

  try {
    models = (await modelsApi.getModelsList(token)) || [];
    applications = (await applicationsApi.getApplicationsList(token)) || [];
    application = await applicationsApi.getApplication((await params.params).id, token, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as DialApplication | null;
    });
    applicationSchemes = (await applicationRunnersApi.getApplicationSchemesList(token)) || [];
    roles = (await rolesApi.getRolesList(token)) || [];
    interceptors = (await interceptorsApi.getInterceptorsList(token)) || [];
  } catch (e) {
    errorObjLog(e, 'Failed to fetch application view data');
  }

  if (application == null) {
    notFound();
  }

  const names = filterDisplayNamesWithVersions(applications, application);

  return (
    <SaveValidationContextProvider>
      <ApplicationView
        names={names}
        etag={etag}
        roles={roles}
        interceptors={interceptors}
        applications={applications}
        models={models}
        applicationSchemes={applicationSchemes}
        originalApplication={application}
      />
    </SaveValidationContextProvider>
  );
}

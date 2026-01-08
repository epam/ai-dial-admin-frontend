import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  getCoreApplication,
  removeApplication,
  updateApplication,
  updateCoreApplication,
} from '@/src/app/[lang]/applications/actions';
import { applicationRunnersApi, applicationsApi, interceptorsApi, modelsApi, rolesApi } from '@/src/app/api/api';
import EntityView from '@/src/components/EntityView/View/EntityView';
import Page403 from '@/src/components/Page403/Page403';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { DialRole } from '@/src/models/dial/role';
import { logError } from '@/src/server/logger';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { filterDisplayNamesWithVersions } from '@/src/utils/entities/filter-names';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';

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
    models = await modelsApi.getModelsList(token);
    applications = await applicationsApi.getApplicationsList(token);
    application = await applicationsApi.getApplication((await params.params).id, token, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as DialApplication | null;
    });
    applicationSchemes = await applicationRunnersApi.getApplicationSchemesList(token);
    roles = await rolesApi.getRolesList(token);
    interceptors = await interceptorsApi.getInterceptorsList(token);
    if (
      applications === void 0 ||
      application === void 0 ||
      applicationSchemes === void 0 ||
      roles === void 0 ||
      interceptors === void 0
    ) {
      return <Page403 />;
    }
  } catch (e) {
    logError(e, 'Failed to fetch application view data');
  }

  if (application == null) {
    redirect(ApplicationRoute.Applications);
  }

  const names = filterDisplayNamesWithVersions(applications, application);

  return (
    <SaveValidationContextProvider>
      <EntityView
        view={ApplicationRoute.Applications}
        names={names}
        etag={etag}
        roles={roles}
        interceptors={interceptors}
        applications={applications}
        models={models}
        applicationSchemes={applicationSchemes}
        originalEntity={application}
        removeEntity={removeApplication}
        updateEntity={updateApplication}
        getCoreEntity={getCoreApplication}
        updateCoreEntity={updateCoreApplication}
      />
    </SaveValidationContextProvider>
  );
}

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { removeApplication, updateApplication } from '@/src/app/[lang]/applications/actions';
import { applicationRunnersApi, applicationsApi, interceptorsApi, modelsApi, rolesApi } from '@/src/app/api/api';
import EntityView from '@/src/components/EntityView/View/EntityView';
import Page403 from '@/src/components/Page403/Page403';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { DialRole } from '@/src/models/dial/role';
import { logger } from '@/src/server/logger';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let models: DialModel[] | null = [];
  let applications: DialApplication[] | null = [];
  let application: DialApplication | null = null;
  let applicationSchemes: DialApplicationScheme[] | null = [];

  let roles: DialRole[] | null = [];
  let interceptors: DialInterceptor[] | null = [];

  try {
    models = await modelsApi.getModelsList(token);
    applications = await applicationsApi.getApplicationsList(token);
    application = await applicationsApi.getApplication((await params.params).id, token);
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
    logger.error('Getting application view data error', e);
  }

  if (application == null) {
    redirect(ApplicationRoute.Applications);
  }

  const names = (applications?.filter((entity) => entity.displayName).map((entity) => entity.displayName) ||
    []) as string[];

  return (
    <SaveValidationContextProvider>
      <EntityView
        view={ApplicationRoute.Applications}
        names={names}
        roles={roles}
        interceptors={interceptors}
        applications={applications}
        models={models}
        applicationSchemes={applicationSchemes}
        originalEntity={application}
        removeEntity={removeApplication}
        updateEntity={updateApplication}
      />
    </SaveValidationContextProvider>
  );
}

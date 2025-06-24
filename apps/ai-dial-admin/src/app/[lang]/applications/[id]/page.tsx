import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { removeApplication, updateApplication } from '@/src/app/[lang]/applications/actions';
import { applicationsApi, applicationRunnersApi, interceptorsApi, rolesApi } from '@/src/app/api/api';
import EntityView from '@/src/components/EntityView/EntityView';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialRole } from '@/src/models/dial/role';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { logger } from '@/src/server/logger';
import Page403 from '@/src/components/Page403/Page403';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let applications: DialApplication[] | null = [];
  let application: DialApplication | null = null;
  let applicationSchemes: DialApplicationScheme[] | null = [];

  let roles: DialRole[] | null = [];
  let interceptors: DialInterceptor[] | null = [];

  try {
    applications = await applicationsApi.getApplicationsList(token);
    application = await applicationsApi.getApplication(decodeURIComponent((await params.params).id), token);
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

  return (
    <EntityView
      view={ApplicationRoute.Applications}
      names={applications?.map((model) => model.displayName || '') || []}
      roles={roles}
      interceptors={interceptors}
      applicationSchemes={applicationSchemes}
      originalEntity={application}
      removeEntity={removeApplication}
      updateEntity={updateApplication}
    />
  );
}

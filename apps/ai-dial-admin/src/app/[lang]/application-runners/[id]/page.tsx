import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { applicationRunnersApi, rolesApi } from '@/src/app/api/api';
import ApplicationRunnersView from '@/src/components/ApplicationRunners/ApplicationRunnersView';
import Page403 from '@/src/components/Page403/Page403';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { AppsFolderProvider } from '@/src/context/assets/AppsFolderContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialRole } from '@/src/models/dial/role';
import { logError } from '@/src/server/logger';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let etag = DEFAULT_ETAG;
  let applicationScheme: DialApplicationScheme | null | undefined = null;
  let roles: DialRole[] | null = [];

  try {
    const id = decodeURIComponent((await params.params).id);
    applicationScheme = await applicationRunnersApi.getApplicationScheme(id, token, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as DialApplicationScheme | null;
    });
    roles = await rolesApi.getRolesList(token);
    if (roles === void 0 || applicationScheme === void 0) {
      return <Page403 />;
    }
  } catch (e) {
    logError(e, 'Failed to fetch application runner data');
  }

  if (applicationScheme == null) {
    redirect(ApplicationRoute.ApplicationRunners);
  }

  return (
    <SaveValidationContextProvider>
      <AppsFolderProvider>
        <ApplicationRunnersView etag={etag} originalScheme={applicationScheme} roles={roles} />
      </AppsFolderProvider>
    </SaveValidationContextProvider>
  );
}

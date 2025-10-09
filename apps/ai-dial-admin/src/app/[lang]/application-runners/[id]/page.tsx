import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { applicationRunnersApi, rolesApi } from '@/src/app/api/api';
import ApplicationRunnersView from '@/src/components/ApplicationRunners/ApplicationRunnersView';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { logger } from '@/src/server/logger';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import Page403 from '@/src/components/Page403/Page403';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialRole } from '@/src/models/dial/role';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';

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
    logger.error('Getting application runner view data error', e);
  }

  if (applicationScheme == null) {
    redirect(ApplicationRoute.ApplicationRunners);
  }

  return (
    <SaveValidationContextProvider>
      <ApplicationRunnersView etag={etag} originalScheme={applicationScheme} roles={roles} />
    </SaveValidationContextProvider>
  );
}

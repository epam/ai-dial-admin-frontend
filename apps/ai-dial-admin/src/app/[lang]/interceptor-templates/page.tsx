import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { SIGN_IN_LINK } from '@/src/constants/auth';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { errorObjLog } from '@/src/server/logger';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

import InterceptorTemplatesList from '@/src/components/InterceptorTemplates/List/List';
import Page403 from '@/src/components/Page403/Page403';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { interceptorTemplatesApi } from '@/src/app/api/api';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  let data: InterceptorTemplate[] | null = [];

  try {
    data = await interceptorTemplatesApi.getInterceptorTemplatesList(token);

    if (data === void 0) {
      return <Page403 />;
    }
  } catch (e) {
    errorObjLog(e, 'Failed to fetch interceptor templates view data');
  }

  return (
    <SaveValidationContextProvider>
      <InterceptorTemplatesList data={data || []} route={ApplicationRoute.InterceptorTemplates} />
    </SaveValidationContextProvider>
  );
}

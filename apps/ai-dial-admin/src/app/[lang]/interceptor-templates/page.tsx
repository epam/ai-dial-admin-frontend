import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { SIGN_IN_LINK } from '@/src/constants/auth';
import { logger } from '@/src/server/logger';
import { ApplicationRoute } from '@/src/types/routes';
import { InterceptorTemplate } from '@/src/models/interceptor-template';

import InterceptorTemplatesList from '@/src/components/InterceptorTemplates/List/List';
import { getInterceptorTemplatesList } from '@/src/app/[lang]/interceptor-templates/actions';
import Page403 from '@/src/components/Page403/Page403';

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
    data = await getInterceptorTemplatesList();

    if (data === void 0) {
      return <Page403 />;
    }
  } catch (e) {
    logger.error('Getting interceptor templates error', e);
  }

  return <InterceptorTemplatesList data={data || []} route={ApplicationRoute.InterceptorTemplates} />;
}

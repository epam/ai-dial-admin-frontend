import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { logger } from '@/src/server/logger';
import { SIGN_IN_LINK } from '@/src/constants/auth';

import InterceptorTemplateView from '@/src/components/InterceptorTemplates/View/View';

export const dynamic = 'force-dynamic';

export default async function Page(__params: { params: Promise<{ id: string }> }) {
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  try {
    // TODO: Add interceptor templates API call and 403 handling and redirect to List page if not found
  } catch (e) {
    logger.error('Getting application runner view data error', e);
  }

  return <InterceptorTemplateView route={ApplicationRoute.InterceptorTemplates} />;
}

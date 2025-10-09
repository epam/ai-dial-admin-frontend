import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { ApplicationRoute } from '@/src/types/routes';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { getInterceptorTemplate } from '@/src/app/[lang]/interceptor-templates/actions';
import { logError } from '@/src/server/logger';
import { SIGN_IN_LINK } from '@/src/constants/auth';

import InterceptorTemplateView from '@/src/components/InterceptorTemplates/View/View';
import Page403 from '@/src/components/Page403/Page403';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  let interceptorTemplate: InterceptorTemplate | null = null;

  try {
    interceptorTemplate = await getInterceptorTemplate((await params.params).id);
    if (interceptorTemplate === void 0) {
      return <Page403 />;
    }
  } catch (e) {
    logError(e, 'Failed to fetch interceptor template data');
  }

  if (!interceptorTemplate) {
    return redirect(ApplicationRoute.InterceptorTemplates);
  }

  return (
    <SaveValidationContextProvider>
      <InterceptorTemplateView route={ApplicationRoute.InterceptorTemplates} template={interceptorTemplate} />
    </SaveValidationContextProvider>
  );
}

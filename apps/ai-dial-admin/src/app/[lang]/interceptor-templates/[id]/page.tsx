import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getInterceptorTemplate } from '@/src/app/[lang]/interceptor-templates/actions';
import { logError } from '@/src/server/logger';
import { SIGN_IN_LINK } from '@/src/constants/auth';
import InterceptorTemplateView from '@/src/components/InterceptorTemplates/View/View';
import Page403 from '@/src/components/Page403/Page403';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { getInterceptorsList } from '@/src/app/[lang]/interceptors/actions';
import { filterNames } from '@/src/utils/entities/filter-names';
import { ApplicationRoute } from '@/src/types/routes';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  let etag = DEFAULT_ETAG;
  let interceptorTemplate: InterceptorTemplate | null = null;
  let interceptors: DialInterceptor[] | null = null;

  try {
    interceptors = await getInterceptorsList();
    interceptorTemplate = await getInterceptorTemplate((await params.params).id, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as InterceptorTemplate | null;
    });
    if (interceptorTemplate === void 0) {
      return <Page403 />;
    }
  } catch (e) {
    logError(e, 'Failed to fetch interceptor template data');
  }

  if (!interceptorTemplate) {
    return redirect(ApplicationRoute.InterceptorTemplates);
  }

  const names = filterNames(interceptors);

  return (
    <SaveValidationContextProvider>
      <InterceptorTemplateView template={interceptorTemplate} names={names} etag={etag} />
    </SaveValidationContextProvider>
  );
}

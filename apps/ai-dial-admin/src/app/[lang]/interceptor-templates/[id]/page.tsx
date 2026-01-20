import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { getInterceptorTemplate } from '@/src/app/[lang]/interceptor-templates/actions';
import { interceptorsApi } from '@/src/app/api/api';
import InterceptorTemplateView from '@/src/components/InterceptorTemplates/View/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { errorObjLog } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { filterNames } from '@/src/utils/entities/filter-names';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let etag = DEFAULT_ETAG;
  let interceptorTemplate: InterceptorTemplate | null = null;
  let interceptors: DialInterceptor[] | null = null;

  try {
    interceptors = await interceptorsApi.getInterceptorsList(token);
    interceptorTemplate = await getInterceptorTemplate((await params.params).id, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as InterceptorTemplate | null;
    });
  } catch (e) {
    errorObjLog(e, 'Failed to fetch interceptor template data');
  }

  if (!interceptorTemplate) {
    notFound();
  }

  const names = filterNames(interceptors);

  return (
    <SaveValidationContextProvider>
      <InterceptorTemplateView template={interceptorTemplate} names={names} etag={etag} />
    </SaveValidationContextProvider>
  );
}

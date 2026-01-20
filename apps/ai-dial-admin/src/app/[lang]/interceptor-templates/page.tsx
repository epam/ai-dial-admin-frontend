import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { interceptorTemplatesApi } from '@/src/app/api/api';
import InterceptorTemplatesList from '@/src/components/InterceptorTemplates/List/List';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { errorObjLog } from '@/src/server/logger';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  let data: InterceptorTemplate[] | null = null;

  try {
    data = await interceptorTemplatesApi.getInterceptorTemplatesList(token);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch interceptor templates view data');
  }

  if (data == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <InterceptorTemplatesList data={data || []} route={ApplicationRoute.InterceptorTemplates} />
    </SaveValidationContextProvider>
  );
}

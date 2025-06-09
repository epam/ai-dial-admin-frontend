import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';

import { addonsApi, applicationsApi, interceptorsApi, modelsApi } from '@/src/app/api/api';
import InterceptorView from '@/src/components/InterceptorsList/InterceptorView';
import { DialAddon } from '@/src/models/dial/addon';
import { DialApplication } from '@/src/models/dial/application';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { logger } from '@/src/server/logger';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let interceptors: DialInterceptor[] = [];
  let interceptor: DialInterceptor | null = null;

  let models: DialModel[] = [];
  let addons: DialAddon[] = [];
  let applications: DialApplication[] = [];

  try {
    interceptors = (await interceptorsApi.getInterceptorsList(token)) || [];
    models = (await modelsApi.getModelsList(token)) || [];
    addons = (await addonsApi.getAddonsList(token)) || [];
    applications = (await applicationsApi.getApplicationsList(token)) || [];

    interceptor = await interceptorsApi.getInterceptor(decodeURIComponent((await params.params).id), token);
  } catch (e) {
    logger.error('Getting interceptor view data error', e);
  }

  if (interceptor == null) {
    redirect(ApplicationRoute.Interceptors);
  }

  return (
    <InterceptorView
      names={interceptors.map((interceptor) => interceptor.name || '')}
      originalInterceptor={interceptor}
      models={models}
      applications={applications}
      addons={addons}
    />
  );
}

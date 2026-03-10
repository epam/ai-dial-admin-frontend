import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { getInterceptorTemplate } from '@/src/app/[lang]/interceptor-templates/actions';
import { getModelsList } from '@/src/app/[lang]/models/actions';
import { applicationRunnersApi, applicationsApi, interceptorsApi, utilityApi } from '@/src/app/api/api';
import InterceptorView from '@/src/components/Interceptors/View/View';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { errorObjLog } from '@/src/server/logger';
import { InterceptorStatus } from '@/src/types/interceptor-status';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { filterNames } from '@/src/utils/entities/filter-names';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let etag = DEFAULT_ETAG;
  let interceptors: DialInterceptor[] | null = [];
  let interceptor: DialInterceptor | null = null;
  let globalInterceptors: string[] | null = [];

  let models: DialModel[] | null = [];
  let applications: DialApplication[] | null = [];
  let interceptorTemplate: InterceptorTemplate | null = null;
  let appRunners: DialApplicationScheme[] | null = [];

  try {
    interceptors = await interceptorsApi.getInterceptorsList(token);
    models = await getModelsList();
    applications = await applicationsApi.getApplicationsList(token);
    appRunners = await applicationRunnersApi.getApplicationSchemesList(token);
    interceptor = await interceptorsApi.getInterceptor((await params.params).id, token, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as DialModel | null;
    });
    globalInterceptors = (await utilityApi.getSystemProperties(token, DEFAULT_ETAG)).response?.globalInterceptors || [];

    interceptor = {
      ...interceptor,
      status: globalInterceptors?.includes(interceptor?.name as string)
        ? InterceptorStatus.GLOBAL
        : InterceptorStatus.LOCAL,
    };

    if (interceptor?.source?.$type === SOURCE_TYPE.RUNNER) {
      interceptorTemplate = await getInterceptorTemplate(interceptor.source?.runnerName as string, DEFAULT_ETAG).then(
        (res) => {
          return res?.response as InterceptorTemplate | null;
        },
      );
    }
  } catch (e) {
    errorObjLog(e, 'Failed to fetch interceptor view data');
  }

  if (interceptor == null) {
    notFound();
  }

  const names = filterNames(interceptors, interceptor?.name);

  return (
    <SaveValidationContextProvider>
      <InterceptorView
        names={names}
        originalInterceptor={interceptor}
        models={models || []}
        etag={etag}
        applications={applications || []}
        interceptorTemplate={interceptorTemplate}
        appRunners={appRunners || []}
      />
    </SaveValidationContextProvider>
  );
}

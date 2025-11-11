import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';

import { applicationRunnersApi, applicationsApi, interceptorsApi, modelsApi } from '@/src/app/api/api';
import InterceptorView from '@/src/components/Interceptors/View/View';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { logError } from '@/src/server/logger';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import Page403 from '@/src/components/Page403/Page403';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { filterNames } from '@/src/utils/entities/filter-names';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { getInterceptorTemplate } from '@/src/app/[lang]/interceptor-templates/actions';
import { InterceptorTemplate } from '@/src/models/interceptor-template';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let etag = DEFAULT_ETAG;
  let interceptors: DialInterceptor[] | null = [];
  let interceptor: DialInterceptor | null = null;

  let models: DialModel[] | null = [];
  let applications: DialApplication[] | null = [];
  let interceptorTemplate: InterceptorTemplate | null = null;
  let appRunners: DialApplicationScheme[] | null = [];

  try {
    interceptors = await interceptorsApi.getInterceptorsList(token);
    models = await modelsApi.getModelsList(token);
    applications = await applicationsApi.getApplicationsList(token);
    appRunners = await applicationRunnersApi.getApplicationSchemesList(token);
    interceptor = await interceptorsApi.getInterceptor((await params.params).id, token, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as DialModel | null;
    });

    if (interceptor?.source?.$type === SOURCE_TYPE.RUNNER) {
      interceptorTemplate = await getInterceptorTemplate(interceptor.source?.runnerName as string, DEFAULT_ETAG).then(
        (res) => {
          return res?.response as InterceptorTemplate | null;
        },
      );
    }

    if (interceptors === void 0 || models === void 0 || applications === void 0 || interceptor === void 0) {
      return <Page403 />;
    }
  } catch (e) {
    logError(e, 'Failed to fetch interceptor view data');
  }

  if (interceptor == null) {
    redirect(ApplicationRoute.Interceptors);
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

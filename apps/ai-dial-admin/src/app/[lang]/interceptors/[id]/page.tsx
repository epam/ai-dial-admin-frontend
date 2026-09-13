import { cookies, headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { ApplicationRoute } from '@/src/types/routes';

import { getInterceptorTemplate } from '@/src/app/[lang]/interceptor-templates/actions';
import { getConfigFileInterceptor } from '@/src/app/[lang]/interceptors/actions';
import { getModelsList } from '@/src/app/[lang]/models/actions';
import { applicationRunnersApi, applicationsApi, interceptorsApi, settingsApi } from '@/src/app/api/api';
import InterceptorView from '@/src/components/Interceptors/View/View';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { readConfigEntities } from '@/src/server/config-entities/read-page-options';
import { errorObjLog } from '@/src/server/logger';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { InterceptorStatus } from '@/src/types/interceptor-status';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ configFile?: string }>;
}) {
  const isConfigFileMode = (await params.searchParams).configFile === 'true';

  if (!process.env.DIAL_ADMIN_API_URL && !isConfigFileMode) {
    redirect(ApplicationRoute.Home);
  }
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let etag = DEFAULT_ETAG;
  let interceptor: DialInterceptor | null = null;
  let globalInterceptors: string[] | null = [];

  let models: DialModel[] | null = [];
  let applications: DialApplication[] | null = [];
  let interceptorTemplate: InterceptorTemplate | null = null;
  let appRunners: DialApplicationScheme[] | null = [];

  try {
    const id = (await params.params).id;

    if (isConfigFileMode) {
      const result = await getConfigFileInterceptor(id);
      interceptor = result.success ? (result.data as DialInterceptor) : null;
      models = await readConfigEntities<DialModel>(token, ConfigFileEntityType.Models, [], true);
      applications = await readConfigEntities<DialApplication>(token, ConfigFileEntityType.Applications, [], true);
      // App Runners have no config-file population — see `config-file-entity-views`.
      appRunners = [];
    } else {
      models = await getModelsList();
      applications = await applicationsApi.getApplicationsList(token);
      appRunners = await applicationRunnersApi.getApplicationSchemesList(token);
      interceptor = await interceptorsApi.getInterceptor(id, token, etag).then((res) => {
        etag = res?.etag || DEFAULT_ETAG;
        return res?.response as DialModel | null;
      });
    }

    // Global-interceptor status is Core-direct-safe in either mode — reused as-is.
    globalInterceptors =
      (await settingsApi.getSystemProperties(token, DEFAULT_ETAG)).response?.globalInterceptors || [];

    if (interceptor) {
      interceptor = {
        ...interceptor,
        status: globalInterceptors?.includes(interceptor?.name as string)
          ? InterceptorStatus.GLOBAL
          : InterceptorStatus.LOCAL,
      };
    }

    if (!isConfigFileMode && interceptor?.source?.$type === SOURCE_TYPE.RUNNER) {
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

  return (
    <SaveValidationContextProvider>
      <InterceptorView
        names={[]}
        originalInterceptor={interceptor}
        models={models || []}
        etag={etag}
        applications={applications || []}
        interceptorTemplate={interceptorTemplate}
        appRunners={appRunners || []}
        isConfigFileSource={isConfigFileMode}
      />
    </SaveValidationContextProvider>
  );
}

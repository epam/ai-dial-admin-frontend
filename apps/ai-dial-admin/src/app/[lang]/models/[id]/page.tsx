import { cookies, headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { ApplicationRoute } from '@/src/types/routes';

import { getConfigFileModel, getModel, getModelsList } from '@/src/app/[lang]/models/actions';
import { interceptorsApi, rolesApi } from '@/src/app/api/api';
import View from '@/src/components/Models/View/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { DialRole } from '@/src/models/dial/role';
import { readConfigEntities } from '@/src/server/config-entities/read-page-options';
import { errorObjLog } from '@/src/server/logger';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { filterDisplayNamesWithVersions } from '@/src/utils/entities/filter-names';
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
  let models: DialModel[] | null = [];
  let model: DialModel | null = null;
  let roles: DialRole[] | null = [];
  let interceptors: DialInterceptor[] | null = [];

  try {
    const id = (await params.params).id;

    if (isConfigFileMode) {
      const result = await getConfigFileModel(id);
      model = result.success ? (result.data as DialModel) : null;
      models = model ? [model] : [];
      roles = await readConfigEntities<DialRole>(token, ConfigFileEntityType.Roles, [], true);
      interceptors = await readConfigEntities<DialInterceptor>(token, ConfigFileEntityType.Interceptors, [], true);
    } else {
      models = await getModelsList();
      model = await getModel(id, etag).then((res) => {
        etag = res?.etag || DEFAULT_ETAG;
        return res?.response as DialModel | null;
      });

      roles = await rolesApi.getRolesList(token);
      interceptors = await interceptorsApi.getInterceptorsList(token);
    }
  } catch (e) {
    errorObjLog(e, 'Failed to fetch model view data');
  }

  if (model == null) {
    notFound();
  }
  const names = filterDisplayNamesWithVersions(models, model);

  return (
    <SaveValidationContextProvider>
      <View
        names={names}
        etag={etag}
        roles={roles}
        interceptors={interceptors}
        originalModel={model}
        isConfigFileSource={isConfigFileMode}
      />
    </SaveValidationContextProvider>
  );
}

import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { getModel, getModelsList } from '@/src/app/[lang]/models/actions';
import { interceptorsApi, rolesApi } from '@/src/app/api/api';
import View from '@/src/components/Models/View/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { DialRole } from '@/src/models/dial/role';
import { errorObjLog } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { filterDisplayNamesWithVersions } from '@/src/utils/entities/filter-names';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let etag = DEFAULT_ETAG;
  let models: DialModel[] | null = [];
  let model: DialModel | null = null;
  let roles: DialRole[] | null = [];
  let interceptors: DialInterceptor[] | null = [];

  try {
    models = await getModelsList();
    model = await getModel((await params.params).id, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as DialModel | null;
    });

    roles = await rolesApi.getRolesList(token);
    interceptors = await interceptorsApi.getInterceptorsList(token);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch model view data');
  }

  if (model == null) {
    notFound();
  }
  const names = filterDisplayNamesWithVersions(models, model);

  return (
    <SaveValidationContextProvider>
      <View names={names} etag={etag} roles={roles} interceptors={interceptors} originalModel={model} />
    </SaveValidationContextProvider>
  );
}

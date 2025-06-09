import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { removeModel, updateModel } from '@/src/app/[lang]/models/actions';
import { interceptorsApi, modelsApi, rolesApi } from '@/src/app/api/api';
import EntityView from '@/src/components/EntityView/EntityView';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { DialRole } from '@/src/models/dial/role';
import { ApplicationRoute } from '@/src/types/routes';
import { logger } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let models: DialModel[] = [];
  let model: DialModel | null = null;
  let roles: DialRole[] = [];
  let interceptors: DialInterceptor[] = [];

  try {
    models = (await modelsApi.getModelsList(token)) || [];
    model = await modelsApi.getModel(decodeURIComponent((await params.params).id), token);
    roles = (await rolesApi.getRolesList(token)) || [];
    interceptors = (await interceptorsApi.getInterceptorsList(token)) || [];
  } catch (e) {
    logger.error('Getting model view data error', e);
  }

  if (model == null) {
    redirect(ApplicationRoute.Models);
  }

  return (
    <EntityView
      view={ApplicationRoute.Models}
      names={models.map((model) => model.displayName || '')}
      roles={roles}
      interceptors={interceptors}
      originalEntity={model}
      removeEntity={removeModel}
      updateEntity={updateModel}
    />
  );
}

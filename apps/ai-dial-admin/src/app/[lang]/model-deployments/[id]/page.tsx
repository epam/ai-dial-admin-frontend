import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { ApplicationRoute } from '@/src/types/routes';
import { Container } from '@/src/models/deployments/containers';
import { DialModel } from '@/src/models/dial/model';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getContainer, getModelContainers } from '@/src/app/actions/deployments';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { createModel } from '@/src/app/[lang]/models/actions';
import { modelsApi } from '@/src/app/api/api';
import { SIGN_IN_LINK } from '@/src/constants/auth';
import { logger } from '@/src/server/logger';

import Page403 from '@/src/components/Page403/Page403';
import ContainerView from '@/src/components/Containers/View/ContainerView';

export const dynamic = 'force-dynamic';

interface Params {
  searchParams: Promise<{ entityType: string }>;
  params: Promise<{ id: string }>;
}

export default async function Page(params: Params) {
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  if (isInvalidSession) {
    return redirect(`/?route=${ApplicationRoute.ModelDeployments}/${(await params.params).id}`);
  }
  let container: Container | null = null;
  let containers: Container[] | null = null;
  let models: DialModel[] | null = null;

  try {
    const containerResponse = await getContainer((await params.params).id);
    const containersResponse = await getModelContainers();

    if (!containerResponse.success || !containersResponse.success) {
      if (containerResponse.status === 403 || containersResponse.status === 403) {
        return <Page403 />;
      }
      redirect(ApplicationRoute.ModelDeployments);
    }
    container = containerResponse.response as Container;
    containers = containersResponse.response as Container[];

    models = await modelsApi.getModelsList(token);
  } catch (e) {
    logger.error(`Getting interceptor container error ${e}`);
  }

  if (!container) {
    redirect(ApplicationRoute.ModelDeployments);
  }

  return (
    <SaveValidationContextProvider>
      <ContainerView
        container={container}
        route={ApplicationRoute.ModelDeployments}
        names={containers?.map((container) => container.name).filter((name) => name !== container.name) || []}
        createEntity={createModel}
        entityNames={models?.map((model) => model.name as string) || []}
      />
    </SaveValidationContextProvider>
  );
}

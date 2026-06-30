import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { createModel, getModelsList } from '@/src/app/[lang]/models/actions';
import { createToolset } from '@/src/app/[lang]/toolsets/actions';
import { getContainer, getModelContainers } from '@/src/app/actions/deployments';
import { toolSetsApi } from '@/src/app/api/api';
import ContainerView from '@/src/components/Containers/View/ContainerView';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { Container } from '@/src/models/deployments/containers';
import { DialModel } from '@/src/models/dial/model';
import { Toolset } from '@/src/models/dial/toolset';
import { errorObjLog } from '@/src/server/logger';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { decodeVariables } from '@/src/utils/deployments/variables';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

interface Params {
  searchParams: Promise<{ entityType: string }>;
  params: Promise<{ id: string }>;
}

export default async function Page(params: Params) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let container: Container | null = null;
  let containers: Container[] | null = null;
  let models: DialModel[] | null = null;
  let toolsets: Toolset[] | null = null;

  try {
    const containerResponse = await getContainer((await params.params).id);
    const containersResponse = await getModelContainers();

    if (!containerResponse.success || !containersResponse.success) {
      notFound();
    }
    container = containerResponse.response as Container;
    containers = containersResponse.response as Container[];

    models = await getModelsList();
    toolsets = await toolSetsApi.getToolsetList(token);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch interceptor container page');
  }

  if (!container) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <ContainerView
        container={decodeVariables(container)}
        route={ApplicationRoute.ModelServings}
        names={containers?.map((container) => container.name || '').filter((name) => name !== container.name) || []}
        createEntity={createModel}
        createToolset={createToolset}
        entityNames={models?.map((model) => model.name as string) || []}
        toolsetNames={toolsets?.map((toolset) => toolset.name as string) || []}
      />
    </SaveValidationContextProvider>
  );
}

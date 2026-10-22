import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { createModel, getModelsList } from '@/src/app/[lang]/models/actions';
import { createToolset } from '@/src/app/[lang]/toolsets/actions';
import { getContainerAssetNames } from '@/src/app/actions/container-asset-names';
import { getContainer, getModelContainers } from '@/src/app/actions/deployments';
import { toolSetsApi } from '@/src/app/api/api';
import ContainerView from '@/src/components/Containers/View/ContainerView';
import { ToolsetFolderProvider } from '@/src/context/assets/ToolsetsFolderContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { Container } from '@/src/models/deployments/containers';
import { DialModel } from '@/src/models/dial/model';
import { Toolset } from '@/src/models/dial/toolset';
import { errorObjLog } from '@/src/server/logger';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getAssetView } from '@/src/utils/deployments/entity';
import { decodeVariables } from '@/src/utils/deployments/variables';
import { getIsAdminApiEnabled } from '@/src/utils/env/get-admin-api-toggle';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

interface Params {
  searchParams: Promise<{ entityType: string }>;
  params: Promise<{ id: string }>;
}

export default async function Page(params: Params) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const isAdminApiEnabled = getIsAdminApiEnabled();

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

    if (isAdminApiEnabled) {
      models = await getModelsList();
      toolsets = await toolSetsApi.getToolsetList(token);
    }
  } catch (e) {
    errorObjLog(e, 'Failed to fetch interceptor container page');
  }

  if (!container) {
    notFound();
  }

  // Outside the admin-backend `try`: a failing admin call must not cost the Core name check.
  const assetNames = await getContainerAssetNames(getAssetView(ApplicationRoute.ModelServings, container));

  return (
    <SaveValidationContextProvider>
      {/* Fresh folder state for the folder-aware asset modal a text-classification serving's toolset
          opens; a model needs none. */}
      <ToolsetFolderProvider>
        <ContainerView
          container={decodeVariables(container)}
          route={ApplicationRoute.ModelServings}
          names={containers?.map((container) => container.name || '').filter((name) => name !== container.name) || []}
          createEntity={isAdminApiEnabled ? createModel : undefined}
          createToolset={isAdminApiEnabled ? createToolset : undefined}
          entityNames={models?.map((model) => model.name as string) || []}
          toolsetNames={toolsets?.map((toolset) => toolset.name as string) || []}
          assetNames={assetNames}
        />
      </ToolsetFolderProvider>
    </SaveValidationContextProvider>
  );
}

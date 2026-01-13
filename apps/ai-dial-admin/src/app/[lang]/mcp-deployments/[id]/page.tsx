import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { SIGN_IN_LINK } from '@/src/constants/auth';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { ApplicationRoute } from '@/src/types/routes';
import { Image } from '@/src/models/deployments/images';
import { Container } from '@/src/models/deployments/containers';
import { getContainer, getImage, getMCPContainers } from '@/src/app/actions/deployments';
import Page403 from '@/src/components/Page403/Page403';
import { errorObjLog, logger } from '@/src/server/logger';
import { Toolset } from '@/src/models/dial/toolset';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import ContainerView from '@/src/components/Containers/View/ContainerView';
import { ToolsetFolderProvider } from '@/src/context/assets/ToolsetsFolderContext';
import { createToolset as createAssetToolset } from '@/src/app/[lang]/assets-toolsets/actions';
import { createToolset } from '@/src/app/[lang]/toolsets/actions';
import { toolSetsApi } from '@/src/app/api/api';

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
    return redirect(`/?route=${ApplicationRoute.McpDeployments}/${(await params.params).id}`);
  }

  let container: Container | null = null;
  let containers: Container[] | null = null;
  let image: Image | null = null;
  let toolsets: Toolset[] | null = null;

  try {
    const containerResponse = await getContainer((await params.params).id);
    const containersResponse = await getMCPContainers();

    if (!containerResponse.success || !containersResponse.success) {
      if (containerResponse.status === 403 || containersResponse.status === 403) {
        return <Page403 />;
      }
      redirect(ApplicationRoute.McpDeployments);
    }
    container = containerResponse.response as Container;
    containers = containersResponse.response as Container[];

    const imageResponse = await getImage(container?.imageDefinitionId as string);
    if (!imageResponse.success) {
      if (imageResponse.status === 403) {
        return <Page403 />;
      }
      redirect(ApplicationRoute.McpDeployments);
    }
    image = imageResponse.response as Image;
    toolsets = await toolSetsApi.getToolsetList(token);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch mcp container page');
  }

  if (!container || !image) {
    redirect(ApplicationRoute.McpDeployments);
  }

  return (
    <SaveValidationContextProvider>
      <ToolsetFolderProvider>
        <ContainerView
          container={container}
          image={image}
          route={ApplicationRoute.McpDeployments}
          names={containers?.map((container) => container.name).filter((name) => name !== container.name) || []}
          createEntity={createToolset}
          createEntityAsAsset={createAssetToolset}
          entityNames={toolsets?.map((toolset) => toolset.name as string) || []}
        />
      </ToolsetFolderProvider>
    </SaveValidationContextProvider>
  );
}

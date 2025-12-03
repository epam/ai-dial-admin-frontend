import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import PluginView from '@/src/components/PluginView/PluginView';
import { SIGN_IN_LINK } from '@/src/constants/auth';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { ApplicationRoute } from '@/src/types/routes';
import { Image, ImageVersion } from '@/src/models/deployments/images';
import { Container } from '@/src/models/deployments/containers';
import {
  createAssetToolset,
  createToolset,
  getContainer,
  getImage,
  getImageVersions,
  getMCPContainers,
  getMCPImages,
  getToolsetList,
} from '@/src/app/actions/deployments';
import Page403 from '@/src/components/Page403/Page403';
import { logger } from '@/src/server/logger';
import ImageView from '@/src/components/Images/View/ImageView';
import { Toolset } from '@/src/models/dial/toolset';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import ContainerView from '@/src/components/Containers/View/ContainerView';
import { DEPLOYMENT_ENTITY } from '@/src/models/deployments';
import { isValueTruthy } from '@/src/utils/types';

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

  if (!isValueTruthy(process.env.DEPLOYMENTS_PLUGIN_ENABLED)) {
    const entityType = (await params.searchParams).entityType;

    if (isInvalidSession) {
      return redirect(`/?route=${ApplicationRoute.McpDeployments}/${(await params.params).id}?type=${entityType}`);
    }

    if (entityType === DEPLOYMENT_ENTITY.images) {
      let image: Image | null = null;
      let images: Image[] | null = null;
      let containers: Container[] | null = null;
      let versions: ImageVersion[] | null = null;

      try {
        const imageResponse = await getImage((await params.params).id);
        const imagesResponse = await getMCPImages();

        if (!imageResponse.success || !imagesResponse.success) {
          if (imageResponse.status === 403 || imagesResponse.status === 403) {
            return <Page403 />;
          }
          redirect(ApplicationRoute.McpDeployments);
        }
        image = imageResponse.response as Image;
        images = imagesResponse.response as Image[];

        const versionsResponse = await getImageVersions(image.name);
        const containersResponse = await getMCPContainers();

        if (!containersResponse.success || !versionsResponse.success) {
          if (containersResponse.status === 403 || versionsResponse.status === 403) {
            return <Page403 />;
          }
          redirect(ApplicationRoute.McpDeployments);
        }
        versions = versionsResponse.response as ImageVersion[];
        containers = containersResponse.response as Container[];
      } catch (e) {
        logger.error(`Getting interceptor image error: ${e}`);
      }

      if (!image) {
        redirect(ApplicationRoute.McpDeployments);
      }

      return (
        <ImageView
          image={image}
          route={ApplicationRoute.McpDeployments}
          imagesNames={images?.map((image) => image.name).filter((name) => name !== image.name) || []}
          containerNames={containers?.map((container) => container.name) || []}
          versions={versions || []}
        />
      );
    }

    if (entityType === DEPLOYMENT_ENTITY.containers) {
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
        toolsets = await getToolsetList();
      } catch (e) {
        logger.error(`Getting interceptor container error ${e}`);
      }

      if (!container || !image) {
        redirect(ApplicationRoute.McpDeployments);
      }

      return (
        <SaveValidationContextProvider>
          <ContainerView
            container={container}
            image={image}
            route={ApplicationRoute.McpDeployments}
            names={containers?.map((container) => container.name).filter((name) => name !== container.name) || []}
            createEntity={createToolset}
            createEntityAsAsset={createAssetToolset}
            entityNames={toolsets?.map((toolset) => toolset.name as string) || []}
          />
        </SaveValidationContextProvider>
      );
    }

    return redirect(ApplicationRoute.McpDeployments);
  }

  return <PluginView slug="mcp-deployments" />;
}

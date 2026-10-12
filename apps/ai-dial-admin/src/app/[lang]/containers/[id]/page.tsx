import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { ComponentProps } from 'react';

import { createAdapter } from '@/src/app/[lang]/adapters/actions';
import { createApplication, getApplications } from '@/src/app/[lang]/applications/actions';
import { createInterceptor } from '@/src/app/[lang]/interceptors/actions';
import { createToolset } from '@/src/app/[lang]/toolsets/actions';
import { getContainer, getContainers, getImage } from '@/src/app/actions/deployments';
import { adaptersApi, interceptorsApi, toolSetsApi } from '@/src/app/api/api';
import ContainerView from '@/src/components/Containers/View/ContainerView';
import { ToolsetFolderProvider } from '@/src/context/assets/ToolsetsFolderContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { Container } from '@/src/models/deployments/containers';
import { Image } from '@/src/models/deployments/images';
import { DialApplication } from '@/src/models/dial/application';
import { errorObjLog } from '@/src/server/logger';
import { CONTAINER_SOURCE_TYPE, CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getContainerKind } from '@/src/utils/deployments/containers';
import { decodeVariables } from '@/src/utils/deployments/variables';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { filterDisplayNamesWithVersions } from '@/src/utils/entities/filter-names';

export const dynamic = 'force-dynamic';

interface Params {
  searchParams: Promise<{ entityType: string }>;
  params: Promise<{ id: string }>;
}

type Token = Awaited<ReturnType<typeof getUserToken>>;

const getEntityNames = async (type: CONTAINER_TYPE, token: Token): Promise<string[]> => {
  switch (type) {
    case CONTAINER_TYPE.ADAPTER:
      return ((await adaptersApi.getAdaptersList(token)) ?? []).map((adapter) => adapter.name as string);
    case CONTAINER_TYPE.INTERCEPTOR:
      return ((await interceptorsApi.getInterceptorsList(token)) ?? []).map(
        (interceptor) => interceptor.name as string,
      );
    case CONTAINER_TYPE.MCP:
      return ((await toolSetsApi.getToolsetList(token)) ?? []).map((toolset) => toolset.name as string);
    case CONTAINER_TYPE.APPLICATION: {
      const response = await getApplications();
      return response.success ? filterDisplayNamesWithVersions(response.response as DialApplication[]) || [] : [];
    }
    default:
      return [];
  }
};

type ContainerViewCreateEntity = NonNullable<ComponentProps<typeof ContainerView>['createEntity']>;

const CREATE_ENTITY: Partial<Record<CONTAINER_TYPE, ContainerViewCreateEntity>> = {
  [CONTAINER_TYPE.ADAPTER]: createAdapter,
  [CONTAINER_TYPE.INTERCEPTOR]: createInterceptor,
  [CONTAINER_TYPE.MCP]: createToolset,
  [CONTAINER_TYPE.APPLICATION]: createApplication,
};

export default async function Page(params: Params) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let container: Container | null = null;
  let containers: Container[] | null = null;
  let image: Image | null = null;
  let entityNames: string[] = [];

  try {
    const containerResponse = await getContainer((await params.params).id);
    if (!containerResponse.success) {
      notFound();
    }
    container = containerResponse.response as Container;

    const kind = getContainerKind(container?.$type);
    if (!container || !kind) {
      notFound();
    }

    const containersResponse = await getContainers(container.$type.toUpperCase());
    if (!containersResponse.success) {
      notFound();
    }
    containers = containersResponse.response as Container[];

    if (container.source?.$type === CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE) {
      const imageResponse = await getImage(container.source.imageDefinitionId as string);
      if (!imageResponse.success) {
        notFound();
      }
      image = imageResponse.response as Image;
    }
    entityNames = await getEntityNames(container.$type, token);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch container page');
  }

  const requiresImage = container?.source?.$type === CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE;
  const kind = getContainerKind(container?.$type);
  if (!container || !kind || (requiresImage && !image)) {
    notFound();
  }

  const view = (
    <ContainerView
      container={decodeVariables(container)}
      image={image ?? void 0}
      route={kind}
      names={containers?.map((item) => item.name as string).filter((name) => name !== container.name) || []}
      createEntity={CREATE_ENTITY[container.$type]}
      entityNames={entityNames}
    />
  );

  return (
    <SaveValidationContextProvider>
      {container.$type === CONTAINER_TYPE.MCP ? <ToolsetFolderProvider>{view}</ToolsetFolderProvider> : view}
    </SaveValidationContextProvider>
  );
}

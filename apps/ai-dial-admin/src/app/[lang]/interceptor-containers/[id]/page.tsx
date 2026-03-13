import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { createInterceptor } from '@/src/app/[lang]/interceptors/actions';
import { getContainer, getImage, getInterceptorContainers } from '@/src/app/actions/deployments';
import { interceptorsApi } from '@/src/app/api/api';
import ContainerView from '@/src/components/Containers/View/ContainerView';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { Container } from '@/src/models/deployments/containers';
import { Image } from '@/src/models/deployments/images';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { errorObjLog } from '@/src/server/logger';
import { CONTAINER_SOURCE_TYPE } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { decodeVariables } from '@/src/utils/deployments/variables';

export const dynamic = 'force-dynamic';

interface Params {
  searchParams: Promise<{ entityType: string }>;
  params: Promise<{ id: string }>;
}

export default async function Page(params: Params) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let container: Container | null = null;
  let containers: Container[] | null = null;
  let image: Image | null = null;
  let interceptors: DialInterceptor[] | null = null;

  try {
    const containerResponse = await getContainer((await params.params).id);
    const containersResponse = await getInterceptorContainers();

    if (!containerResponse.success || !containersResponse.success) {
      notFound();
    }
    container = containerResponse.response as Container;
    containers = containersResponse.response as Container[];

    if (container?.source?.$type === CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE) {
      const imageResponse = await getImage(container?.source.imageDefinitionId as string);
      if (!imageResponse.success) {
        notFound();
      }
      image = imageResponse.response as Image;
    }
    interceptors = await interceptorsApi.getInterceptorsList(token);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch interceptor container page');
  }

  const requiresImage = container?.source?.$type === CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE;
  if (!container || (requiresImage && !image)) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <ContainerView
        container={decodeVariables(container)}
        image={image ?? void 0}
        route={ApplicationRoute.InterceptorContainers}
        names={containers?.map((container) => container.name as string).filter((name) => name !== container.name) || []}
        createEntity={createInterceptor}
        entityNames={interceptors?.map((interceptor) => interceptor.name as string) || []}
      />
    </SaveValidationContextProvider>
  );
}

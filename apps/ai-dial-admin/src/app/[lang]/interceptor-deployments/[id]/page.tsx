import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { SIGN_IN_LINK } from '@/src/constants/auth';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { ApplicationRoute } from '@/src/types/routes';
import { Image } from '@/src/models/deployments/images';
import { Container } from '@/src/models/deployments/containers';
import { getContainer, getImage, getInterceptorContainers } from '@/src/app/actions/deployments';
import Page403 from '@/src/components/Page403/Page403';
import { errorObjLog } from '@/src/server/logger';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import ContainerView from '@/src/components/Containers/View/ContainerView';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { createInterceptor } from '@/src/app/[lang]/interceptors/actions';
import { interceptorsApi } from '@/src/app/api/api';

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
    return redirect(`/?route=${ApplicationRoute.InterceptorDeployments}/${(await params.params).id}`);
  }

  let container: Container | null = null;
  let containers: Container[] | null = null;
  let image: Image | null = null;
  let interceptors: DialInterceptor[] | null = null;

  try {
    const containerResponse = await getContainer((await params.params).id);
    const containersResponse = await getInterceptorContainers();

    if (!containerResponse.success || !containersResponse.success) {
      if (containerResponse.status === 403 || containersResponse.status === 403) {
        return <Page403 />;
      }
      redirect(ApplicationRoute.InterceptorDeployments);
    }
    container = containerResponse.response as Container;
    containers = containersResponse.response as Container[];

    const imageResponse = await getImage(container?.imageDefinitionId as string);
    if (!imageResponse.success) {
      if (imageResponse.status === 403) {
        return <Page403 />;
      }
      redirect(ApplicationRoute.InterceptorDeployments);
    }
    image = imageResponse.response as Image;
    interceptors = await interceptorsApi.getInterceptorsList(token);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch interceptor container page');
  }

  if (!container || !image) {
    redirect(ApplicationRoute.InterceptorDeployments);
  }

  return (
    <SaveValidationContextProvider>
      <ContainerView
        container={container}
        image={image}
        route={ApplicationRoute.InterceptorDeployments}
        names={containers?.map((container) => container.name).filter((name) => name !== container.name) || []}
        createEntity={createInterceptor}
        entityNames={interceptors?.map((interceptor) => interceptor.name as string) || []}
      />
    </SaveValidationContextProvider>
  );
}

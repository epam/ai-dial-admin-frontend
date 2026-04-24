import { notFound } from 'next/navigation';

import { getApplicationContainers, getContainer, getImage } from '@/src/app/actions/deployments';
import { createApplication, getApplications } from '@/src/app/[lang]/applications/actions';
import ContainerView from '@/src/components/Containers/View/ContainerView';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { Container } from '@/src/models/deployments/containers';
import { DialApplication } from '@/src/models/dial/application';
import { Image } from '@/src/models/deployments/images';
import { errorObjLog } from '@/src/server/logger';
import { CONTAINER_SOURCE_TYPE } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { decodeVariables } from '@/src/utils/deployments/variables';

export const dynamic = 'force-dynamic';

interface Params {
  searchParams: Promise<{ entityType: string }>;
  params: Promise<{ id: string }>;
}

export default async function Page(params: Params) {
  let container: Container | null = null;
  let containers: Container[] | null = null;
  let image: Image | null = null;
  let applications: DialApplication[] | null = null;

  try {
    const containerResponse = await getContainer((await params.params).id);
    const containersResponse = await getApplicationContainers();

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

    const applicationsResponse = await getApplications();
    if (applicationsResponse.success) {
      applications = applicationsResponse.response as DialApplication[];
    }
  } catch (e) {
    errorObjLog(e, 'Failed to fetch application container page');
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
        route={ApplicationRoute.ApplicationContainers}
        names={containers?.map((container) => container.name as string).filter((name) => name !== container.name) || []}
        createEntity={createApplication}
        entityNames={applications?.map((app) => app.name as string) || []}
      />
    </SaveValidationContextProvider>
  );
}

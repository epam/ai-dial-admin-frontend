import { notFound } from 'next/navigation';

import { getContainers, getImage, getImageVersions } from '@/src/app/actions/deployments';
import ImageView from '@/src/components/Images/View/ImageView';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { Image, ImageVersion } from '@/src/models/deployments/images';
import { errorObjLog } from '@/src/server/logger';
import { getRouteByType } from '@/src/utils/deployments/entity';
import { getImageType } from '@/src/utils/deployments/images';
import { Container } from '@/src/models/deployments/containers';

export const dynamic = 'force-dynamic';

interface Params {
  searchParams: Promise<{ entityType: string }>;
  params: Promise<{ id: string }>;
}

export default async function Page(params: Params) {
  let image: Image | null = null;
  let versions: ImageVersion[] | null = null;
  let containers: Container[] | null = null;

  try {
    const imageResponse = await getImage((await params.params).id);
    const containersResponse = await getContainers();
    const versionsResponse = await getImageVersions(
      imageResponse.response.name,
      getImageType(getRouteByType(imageResponse.response.$type)),
    );
    containers = containersResponse.response as Container[];
    image = imageResponse.response as Image;
    versions = versionsResponse.response as ImageVersion[];
  } catch (e) {
    errorObjLog(e, 'Failed to fetch interceptor image page');
  }

  if (!image) {
    notFound();
  }

  const names = containers?.map((container) => container.name || '') || [];

  return (
    <SaveValidationContextProvider>
      <ImageView image={image} versions={versions || []} containerNames={names} />
    </SaveValidationContextProvider>
  );
}

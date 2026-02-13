import { notFound } from 'next/navigation';

import { getImage, getImageVersions } from '@/src/app/actions/deployments';
import ImageView from '@/src/components/Images/View/ImageView';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { Image, ImageVersion } from '@/src/models/deployments/images';
import { errorObjLog } from '@/src/server/logger';
import { getRouteByType } from '@/src/utils/deployments/entity';
import { getImageType } from '@/src/utils/deployments/images';

export const dynamic = 'force-dynamic';

interface Params {
  searchParams: Promise<{ entityType: string }>;
  params: Promise<{ id: string }>;
}

export default async function Page(params: Params) {
  let image: Image | null = null;
  let versions: ImageVersion[] | null = null;

  try {
    const imageResponse = await getImage((await params.params).id);

    const versionsResponse = await getImageVersions(
      imageResponse.response.name,
      getImageType(getRouteByType(imageResponse.response.$type)),
    );

    image = imageResponse.response as Image;
    versions = versionsResponse.response as ImageVersion[];
  } catch (e) {
    errorObjLog(e, 'Failed to fetch interceptor image page');
  }

  if (!image) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <ImageView image={image} versions={versions || []} />
    </SaveValidationContextProvider>
  );
}

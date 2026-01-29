import { notFound } from 'next/navigation';

import { getImages } from '@/src/app/actions/deployments';
import ImagesList from '@/src/components/Images/List/ImagesList';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { Image } from '@/src/models/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';
import { getUniqueLatestImages } from '@/src/utils/deployments/images';
import { errorObjLog } from '@/src/server/logger';
import { ServerActionResponse } from '@/src/models/server-action';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let imagesResponse: ServerActionResponse<Image[]> | null = null;

  try {
    imagesResponse = await getImages();
  } catch (e) {
    errorObjLog(e, 'Failed to interceptor containers data');
  }

  if (!imagesResponse || !imagesResponse.success) {
    notFound();
  }
  const images = imagesResponse.response || [];

  return (
    <SaveValidationContextProvider>
      <ImagesList route={ApplicationRoute.Images} imagesList={getUniqueLatestImages(images)} />
    </SaveValidationContextProvider>
  );
}

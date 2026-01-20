import { getImages } from '@/src/app/actions/deployments';
import ImagesList from '@/src/components/Images/List/ImagesList';
import Page404 from '@/src/components/Page404/Page404';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { Image } from '@/src/models/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';
import { getUniqueLatestImages } from '@/src/utils/deployments/images';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const imagesResponse = await getImages();

  if (!imagesResponse.success) {
    return <Page404 />;
  }

  const images = imagesResponse.response as Image[];

  return (
    <SaveValidationContextProvider>
      <ImagesList route={ApplicationRoute.Images} imagesList={getUniqueLatestImages(images)} />
    </SaveValidationContextProvider>
  );
}

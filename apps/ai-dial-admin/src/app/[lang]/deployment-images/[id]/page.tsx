import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { ApplicationRoute } from '@/src/types/routes';
import { Image, ImageVersion } from '@/src/models/deployments/images';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getImage, getImageContainers, getImages, getImageVersions } from '@/src/app/actions/deployments';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { logger } from '@/src/server/logger';
import { SIGN_IN_LINK } from '@/src/constants/auth';

import Page403 from '@/src/components/Page403/Page403';
import ImageView from '@/src/components/Images/View/ImageView';
import { Container } from '@/src/models/deployments/containers';

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
    return redirect(`/?route=${ApplicationRoute.Images}/${(await params.params).id}`);
  }

  let image: Image | null = null;
  let images: Image[] | null = null;
  let versions: ImageVersion[] | null = null;
  let dependencies: Container[] | null = null;

  try {
    const imageResponse = await getImage((await params.params).id);
    const imagesResponse = await getImages();
    const versionsResponse = await getImageVersions(imageResponse.response.name);
    const dependeinciesResponses = await getImageContainers((await params.params).id);

    if (
      !imageResponse.success ||
      !imagesResponse.success ||
      !versionsResponse.success ||
      !dependeinciesResponses.success
    ) {
      if (
        imageResponse.status === 403 ||
        imagesResponse.status === 403 ||
        versionsResponse.status === 403 ||
        dependeinciesResponses.status === 403
      ) {
        return <Page403 />;
      }
      redirect(ApplicationRoute.Images);
    }
    image = imageResponse.response as Image;
    images = imagesResponse.response as Image[];
    versions = versionsResponse.response as ImageVersion[];
    dependencies = dependeinciesResponses.response as Container[];
  } catch (e) {
    logger.error(`Getting interceptor image error: ${e}`);
  }

  if (!image) {
    redirect(ApplicationRoute.Images);
  }

  return (
    <SaveValidationContextProvider>
      <ImageView
        image={image}
        route={ApplicationRoute.Images}
        imagesNames={images?.map((image) => image.name).filter((name) => name !== image.name) || []}
        versions={versions || []}
        dependencies={dependencies || []}
      />
    </SaveValidationContextProvider>
  );
}

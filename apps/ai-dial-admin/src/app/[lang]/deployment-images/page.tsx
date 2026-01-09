import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { Image } from '@/src/models/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { getImages } from '@/src/app/actions/deployments';
import { getUniqueLatestImages } from '@/src/utils/deployments/images';
import { SIGN_IN_LINK } from '@/src/constants/auth';

import Page403 from '@/src/components/Page403/Page403';
import ImagesList from '@/src/components/Images/List/ImagesList';
import Page404 from '@/src/components/Page404/Page404';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  const imagesResponse = await getImages();

  if (!imagesResponse.success) {
    if (imagesResponse.status === 403) {
      return <Page403 />;
    }
    return <Page404 />;
  }

  const images = imagesResponse.response as Image[];

  return (
    <SaveValidationContextProvider>
      <ImagesList route={ApplicationRoute.Images} imagesList={getUniqueLatestImages(images)} />
    </SaveValidationContextProvider>
  );
}

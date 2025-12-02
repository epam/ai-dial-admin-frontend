import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import PluginView from '@/src/components/PluginView/PluginView';
import { SIGN_IN_LINK } from '@/src/constants/auth';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { Container } from '@/src/models/deployments/containers';
import { getInterceptorContainers, getInterceptorImages } from '@/src/app/actions/deployments';
import Page403 from '@/src/components/Page403/Page403';
import { Image } from '@/src/models/deployments/images';
import DeploymentsEntityListView from '@/src/components/Common/DeploymentsEntityListView/DeploymentsEntityListView';
import { ApplicationRoute } from '@/src/types/routes';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  if (process.env.DEPLOYMENTS_PLUGIN_ENABLED !== 'true') {
    const imagesResponse = await getInterceptorImages();
    const containersResponse = await getInterceptorContainers();

    if (!imagesResponse.success || !containersResponse.success) {
      if (imagesResponse.status === 403 || containersResponse.status === 403) {
        return <Page403 />;
      }
      return null;
    }

    const images = imagesResponse.response as Image[];
    const containers = containersResponse.response as Container[];

    return (
      <SaveValidationContextProvider>
        <DeploymentsEntityListView
          route={ApplicationRoute.InterceptorDeployments}
          images={images}
          containers={containers}
        />
      </SaveValidationContextProvider>
    );
  }

  return <PluginView slug="interceptor-deployments" />;
}

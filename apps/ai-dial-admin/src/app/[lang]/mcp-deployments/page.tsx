import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getMCPContainers } from '@/src/app/actions/deployments';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { SIGN_IN_LINK } from '@/src/constants/auth';

import Page403 from '@/src/components/Page403/Page403';
import ContainersList from '@/src/components/Containers/List/ContainersList';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  const containersResponse = await getMCPContainers();

  if (!containersResponse.success) {
    if (containersResponse.status === 403) {
      return <Page403 />;
    }
    return null;
  }

  const containers = containersResponse.response as Container[];

  return (
    <SaveValidationContextProvider>
      <ContainersList route={ApplicationRoute.McpDeployments} containersList={containers} />
    </SaveValidationContextProvider>
  );
}

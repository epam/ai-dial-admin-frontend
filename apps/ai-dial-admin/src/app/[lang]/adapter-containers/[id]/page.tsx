import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { getAdapterContainers, getContainer } from '@/src/app/actions/deployments';
import { adaptersApi } from '@/src/app/api/api';
import ContainerView from '@/src/components/Containers/View/ContainerView';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { Container } from '@/src/models/deployments/containers';
import { errorObjLog } from '@/src/server/logger';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { decodeVariables } from '@/src/utils/deployments/variables';
import { createAdapter } from '@/src/app/[lang]/adapters/actions';
import { DialAdapter } from '@/src/models/dial/adapter';

export const dynamic = 'force-dynamic';

interface Params {
  searchParams: Promise<{ entityType: string }>;
  params: Promise<{ id: string }>;
}

export default async function Page(params: Params) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let container: Container | null = null;
  let containers: Container[] | null = null;
  let adapters: DialAdapter[] | null = null;

  try {
    const containerResponse = await getContainer((await params.params).id);
    const containersResponse = await getAdapterContainers();

    if (!containerResponse.success || !containersResponse.success) {
      notFound();
    }
    container = containerResponse.response as Container;
    containers = containersResponse.response as Container[];
    adapters = await adaptersApi.getAdaptersList(token);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch interceptor container page');
  }

  if (!container) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <ContainerView
        container={decodeVariables(container)}
        route={ApplicationRoute.AdapterContainers}
        names={containers?.map((container) => container.name as string).filter((name) => name !== container.name) || []}
        createEntity={createAdapter}
        entityNames={adapters?.map((adapter) => adapter.name as string) || []}
      />
    </SaveValidationContextProvider>
  );
}

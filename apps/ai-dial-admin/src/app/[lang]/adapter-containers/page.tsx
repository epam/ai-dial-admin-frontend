import { notFound } from 'next/navigation';

import { getContainers } from '@/src/app/actions/deployments';
import ContainersList from '@/src/components/Containers/List/ContainersList';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { ServerActionResponse } from '@/src/models/server-action';
import { errorObjLog } from '@/src/server/logger';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let containersResponse: ServerActionResponse<Container[]> | null = null;

  try {
    containersResponse = await getContainers();
  } catch (e) {
    errorObjLog(e, 'Failed to interceptor containers data');
  }

  if (!containersResponse || !containersResponse.success) {
    notFound();
  }
  const allContainers = containersResponse.response || [];
  const containers = allContainers.filter((container) => container.$type === CONTAINER_TYPE.ADAPTER);
  const names = allContainers.map((container) => container.name || '');

  return (
    <SaveValidationContextProvider>
      <ContainersList route={ApplicationRoute.AdapterContainers} containersList={containers} names={names} />
    </SaveValidationContextProvider>
  );
}

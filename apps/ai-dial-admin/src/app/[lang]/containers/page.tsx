import { notFound } from 'next/navigation';

import { getContainers } from '@/src/app/actions/deployments';
import ContainersList from '@/src/components/Containers/List/ContainersList';
import { UNIFIED_CONTAINER_TYPES } from '@/src/constants/deployments/container-types';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { Container } from '@/src/models/deployments/containers';
import { ServerActionResponse } from '@/src/models/server-action';
import { errorObjLog } from '@/src/server/logger';
import { ApplicationRoute } from '@/src/types/routes';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let containersResponse: ServerActionResponse<Container[]> | null = null;

  try {
    containersResponse = await getContainers();
  } catch (e) {
    errorObjLog(e, 'Failed to fetch containers data');
  }

  if (!containersResponse || !containersResponse.success) {
    notFound();
  }
  const allContainers = containersResponse.response || [];
  const containers = allContainers.filter((container) => UNIFIED_CONTAINER_TYPES.includes(container.$type));
  // A container's id is unique across every deployment type, so names are checked against all of them.
  const names = allContainers.map((container) => container.name || '');

  return (
    <SaveValidationContextProvider>
      <ContainersList route={ApplicationRoute.Containers} containersList={containers} names={names} />
    </SaveValidationContextProvider>
  );
}

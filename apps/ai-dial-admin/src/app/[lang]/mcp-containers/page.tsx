import { notFound } from 'next/navigation';

import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { getContainers } from '@/src/app/actions/deployments';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

import ContainersList from '@/src/components/Containers/List/ContainersList';
import { ServerActionResponse } from '@/src/models/server-action';
import { errorObjLog } from '@/src/server/logger';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let containersResponse: ServerActionResponse<Container[]> | null = null;

  try {
    containersResponse = await getContainers();
  } catch (e) {
    errorObjLog(e, 'Failed to mcp containers data');
  }

  if (!containersResponse || !containersResponse.success) {
    notFound();
  }
  const allContainers = containersResponse.response || [];
  const containers = allContainers.filter((container) => container.$type === CONTAINER_TYPE.MCP);
  const names = allContainers.map((container) => container.name || '');

  return (
    <SaveValidationContextProvider>
      <ContainersList route={ApplicationRoute.McpContainers} containersList={containers} names={names} />
    </SaveValidationContextProvider>
  );
}

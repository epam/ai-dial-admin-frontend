import { notFound } from 'next/navigation';

import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { getMCPContainers } from '@/src/app/actions/deployments';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

import ContainersList from '@/src/components/Containers/List/ContainersList';
import { ServerActionResponse } from '@/src/models/server-action';
import { errorObjLog } from '@/src/server/logger';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let containersResponse: ServerActionResponse<Container[]> | null = null;

  try {
    containersResponse = await getMCPContainers();
  } catch (e) {
    errorObjLog(e, 'Failed to mcp containers data');
  }

  if (!containersResponse || !containersResponse.success) {
    notFound();
  }
  const containers = containersResponse.response || [];

  return (
    <SaveValidationContextProvider>
      <ContainersList route={ApplicationRoute.McpContainers} containersList={containers} />
    </SaveValidationContextProvider>
  );
}

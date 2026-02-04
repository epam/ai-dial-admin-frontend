import { notFound } from 'next/navigation';

import { getModelContainers } from '@/src/app/actions/deployments';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { ServerActionResponse } from '@/src/models/server-action';
import { errorObjLog } from '@/src/server/logger';

import ContainersList from '@/src/components/Containers/List/ContainersList';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let containersResponse: ServerActionResponse<Container[]> | null = null;

  try {
    containersResponse = await getModelContainers();
  } catch (e) {
    errorObjLog(e, 'Failed to mcp containers data');
  }

  if (!containersResponse || !containersResponse.success) {
    notFound();
  }
  const containers = containersResponse.response || [];

  return (
    <SaveValidationContextProvider>
      <ContainersList route={ApplicationRoute.ModelServings} containersList={containers} />
    </SaveValidationContextProvider>
  );
}

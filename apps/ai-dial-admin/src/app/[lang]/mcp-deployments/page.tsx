import { notFound } from 'next/navigation';

import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { getMCPContainers } from '@/src/app/actions/deployments';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

import ContainersList from '@/src/components/Containers/List/ContainersList';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const containersResponse = await getMCPContainers();

  if (!containersResponse.success) {
    notFound();
  }

  const containers = containersResponse.response as Container[];

  return (
    <SaveValidationContextProvider>
      <ContainersList route={ApplicationRoute.McpDeployments} containersList={containers} />
    </SaveValidationContextProvider>
  );
}

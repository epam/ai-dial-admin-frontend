import { notFound } from 'next/navigation';

import { getModelContainers } from '@/src/app/actions/deployments';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';

import ContainersList from '@/src/components/Containers/List/ContainersList';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const containersResponse = await getModelContainers();

  if (!containersResponse.success) {
    notFound();
  }

  const containers = containersResponse.response as Container[];

  return (
    <SaveValidationContextProvider>
      <ContainersList route={ApplicationRoute.ModelDeployments} containersList={containers} />
    </SaveValidationContextProvider>
  );
}

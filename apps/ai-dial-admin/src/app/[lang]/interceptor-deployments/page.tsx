import { notFound } from 'next/navigation';

import { getInterceptorContainers } from '@/src/app/actions/deployments';
import ContainersList from '@/src/components/Containers/List/ContainersList';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const containersResponse = await getInterceptorContainers();

  if (!containersResponse.success) {
    notFound();
  }

  const containers = containersResponse.response as Container[];

  return (
    <SaveValidationContextProvider>
      <ContainersList route={ApplicationRoute.InterceptorDeployments} containersList={containers} />
    </SaveValidationContextProvider>
  );
}

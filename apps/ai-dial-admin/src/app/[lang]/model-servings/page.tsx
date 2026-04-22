import { notFound, redirect } from 'next/navigation';

import { getContainers } from '@/src/app/actions/deployments';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { ServerActionResponse } from '@/src/models/server-action';
import { errorObjLog } from '@/src/server/logger';
import { isValueTruthy } from '@/src/utils/types';

import ContainersList from '@/src/components/Containers/List/ContainersList';
import { CONTAINER_TYPE } from '@/src/types/deployments/containers';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const nimEnabled = isValueTruthy(process.env.NIM_ENABLED);
  const hfEnabled = isValueTruthy(process.env.HF_ENABLED);

  if (!nimEnabled && !hfEnabled) {
    redirect(ApplicationRoute.Home);
  }

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
  const containers = allContainers.filter(
    (container) => container.$type === CONTAINER_TYPE.NIM || container.$type === CONTAINER_TYPE.HF,
  );
  const names = allContainers.map((container) => container.name || '');

  return (
    <SaveValidationContextProvider>
      <ContainersList route={ApplicationRoute.ModelServings} containersList={containers} names={names} />
    </SaveValidationContextProvider>
  );
}

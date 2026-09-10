import ImportConfig from '@/src/components/ImportConfig/ImportConfig';
import { isValueTruthy } from '@/src/utils/types';
import { redirect } from 'next/navigation';

import { ApplicationRoute } from '@/src/types/routes';

export const dynamic = 'force-dynamic';

export default async function Page() {
  if (!process.env.DIAL_ADMIN_API_URL) {
    redirect(ApplicationRoute.Home);
  }

  return <ImportConfig deploymentsEnabled={isValueTruthy(process.env.DEPLOYMENTS_ENABLED)} />;
}

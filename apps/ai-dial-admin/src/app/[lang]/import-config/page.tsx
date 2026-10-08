import ImportConfig from '@/src/components/ImportConfig/ImportConfig';
import { getIsAdminApiEnabled } from '@/src/utils/env/get-admin-api-toggle';
import { getIsConfigTransferEnabled } from '@/src/utils/env/get-config-transfer-toggle';
import { getIsAnalyticsEnabled } from '@/src/utils/env/get-analytics-toggle';
import { isValueTruthy } from '@/src/utils/types';
import { redirect } from 'next/navigation';

import { ApplicationRoute } from '@/src/types/routes';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const isAdminApiEnabled = getIsAdminApiEnabled();
  const isDeploymentsEnabled = isValueTruthy(process.env.DEPLOYMENTS_ENABLED);
  const isAnalyticsEnabled = getIsAnalyticsEnabled();

  if (
    !getIsConfigTransferEnabled({
      adminApiEnabled: isAdminApiEnabled,
      deploymentsEnabled: isDeploymentsEnabled,
      analyticsEnabled: isAnalyticsEnabled,
    })
  ) {
    redirect(ApplicationRoute.Home);
  }

  return (
    <ImportConfig
      isAdminApiEnabled={isAdminApiEnabled}
      deploymentsEnabled={isDeploymentsEnabled}
      isAnalyticsEnabled={isAnalyticsEnabled}
    />
  );
}

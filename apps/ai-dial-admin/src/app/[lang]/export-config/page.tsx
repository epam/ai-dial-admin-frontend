import ExportConfig from '@/src/components/ExportConfig/ExportConfig';
import { isValueTruthy } from '@/src/utils/types';
import { redirect } from 'next/navigation';

import { ApplicationRoute } from '@/src/types/routes';

export const dynamic = 'force-dynamic';

export default async function Page() {
  if (!process.env.DIAL_ADMIN_API_URL) {
    redirect(ApplicationRoute.Home);
  }

  return (
    <ExportConfig
      enableExportConfigMap={isValueTruthy(process.env.ENABLE_EXPORT_CONFIG_MAP)}
      deploymentsEnabled={isValueTruthy(process.env.DEPLOYMENTS_ENABLED)}
    />
  );
}

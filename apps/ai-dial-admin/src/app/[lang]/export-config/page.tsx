import ExportConfig from '@/src/components/ExportConfig/ExportConfig';
import { isValueTruthy } from '@/src/utils/types';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <ExportConfig
      enableExportConfigMap={isValueTruthy(process.env.ENABLE_EXPORT_CONFIG_MAP)}
      deploymentsEnabled={isValueTruthy(process.env.DEPLOYMENTS_ENABLED)}
    />
  );
}

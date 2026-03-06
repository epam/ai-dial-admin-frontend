import ImportConfig from '@/src/components/ImportConfig/ImportConfig';
import { isValueTruthy } from '@/src/utils/types';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return <ImportConfig deploymentsEnabled={isValueTruthy(process.env.DEPLOYMENTS_ENABLED)} />;
}

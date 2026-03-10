import { ApplicationRoute } from '@/src/types/routes';
import UsageLog from '@/src/components/UsageLog/UsageLog';

export default async function Page() {
  return <UsageLog className="bg-layer-2 rounded py-4 px-6" route={ApplicationRoute.UsageLog} />;
}

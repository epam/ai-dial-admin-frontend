import { redirect } from 'next/navigation';

import { ApplicationRoute } from '@/src/types/routes';
import UsageLog from '@/src/components/UsageLog/UsageLog';

export default async function Page() {
  if (!process.env.DIAL_ADMIN_API_URL) {
    redirect(ApplicationRoute.Home);
  }

  return <UsageLog className="bg-layer-2 rounded py-4 px-6" route={ApplicationRoute.UsageLog} />;
}

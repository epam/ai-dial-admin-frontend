import { redirect } from 'next/navigation';

import { ApplicationRoute } from '@/src/types/routes';
import UsageLog from '@/src/components/UsageLog/UsageLog';

export default async function Page() {
  if (!process.env.DIAL_ADMIN_API_URL) {
    redirect(ApplicationRoute.Home);
  }

  return <UsageLog route={ApplicationRoute.UsageLog} />;
}

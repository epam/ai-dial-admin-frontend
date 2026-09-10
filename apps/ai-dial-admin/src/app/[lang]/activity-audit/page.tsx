import ActivityAuditList from '@/src/components/ActivityAudit/List/List';
import { redirect } from 'next/navigation';

import { ApplicationRoute } from '@/src/types/routes';

export const dynamic = 'force-dynamic';

export default async function Page() {
  if (!process.env.DIAL_ADMIN_API_URL) {
    redirect(ApplicationRoute.Home);
  }

  return <ActivityAuditList />;
}

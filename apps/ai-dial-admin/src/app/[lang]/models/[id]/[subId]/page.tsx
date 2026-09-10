import { cookies, headers } from 'next/headers';
import AuditView from '@/src/components/ActivityAudit/View/AuditView';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { notFound, redirect } from 'next/navigation';

import { ApplicationRoute } from '@/src/types/routes';
import { getActivityAuditDetailData } from '@/src/utils/audit/get-activity-audit-detail-data';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ subId: string }> }) {
  if (!process.env.DIAL_ADMIN_API_URL) {
    redirect(ApplicationRoute.Home);
  }
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const auditViewId = decodeURIComponent((await params.params).subId);

  const { activity, activityRevision, previousRevision, entity } = await getActivityAuditDetailData(auditViewId, token);

  if (activity == null) {
    notFound();
  }

  return (
    <AuditView
      activity={activity}
      activityRevision={activityRevision}
      previousRevision={previousRevision}
      entity={entity}
      isEntityActivity
    />
  );
}

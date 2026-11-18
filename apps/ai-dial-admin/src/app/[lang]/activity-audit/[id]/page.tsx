import { cookies, headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { ApplicationRoute } from '@/src/types/routes';

import { SYSTEM_ROLLBACK_ID } from '@/src/components/ActivityAudit/Rollback/constants';
import SystemRollback from '@/src/components/ActivityAudit/Rollback/SystemRollback';
import AuditView from '@/src/components/ActivityAudit/View/AuditView';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getActivityAuditDetailData } from '@/src/utils/audit/get-activity-audit-detail-data';
import { getIsAdminApiEnabled } from '@/src/utils/env/get-admin-api-toggle';
import { getIsAnalyticsEnabled } from '@/src/utils/env/get-analytics-toggle';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const auditViewId = decodeURIComponent((await params.params).id);
  if (!getIsAdminApiEnabled() && (!getIsAnalyticsEnabled() || auditViewId === SYSTEM_ROLLBACK_ID)) {
    redirect(ApplicationRoute.Home);
  }
  if (auditViewId === SYSTEM_ROLLBACK_ID) {
    return <SystemRollback />;
  }

  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
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
    />
  );
}

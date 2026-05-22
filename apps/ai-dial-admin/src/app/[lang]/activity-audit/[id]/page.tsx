import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { SYSTEM_ROLLBACK_ID } from '@/src/components/ActivityAudit/Rollback/constants';
import SystemRollback from '@/src/components/ActivityAudit/Rollback/SystemRollback';
import AuditView from '@/src/components/ActivityAudit/View/AuditView';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getActivityAuditDetailData } from '@/src/utils/audit/get-activity-audit-detail-data';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const auditViewId = decodeURIComponent((await params.params).id);
  if (auditViewId === SYSTEM_ROLLBACK_ID) {
    return <SystemRollback />;
  }

  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const { activity, activityRevision, previousRevision, entity, currentResourceStatus } =
    await getActivityAuditDetailData(auditViewId, token);

  if (activity == null) {
    notFound();
  }

  return (
    <AuditView
      activity={activity}
      activityRevision={activityRevision}
      previousRevision={previousRevision}
      entity={entity}
      currentResourceStatus={currentResourceStatus}
    />
  );
}

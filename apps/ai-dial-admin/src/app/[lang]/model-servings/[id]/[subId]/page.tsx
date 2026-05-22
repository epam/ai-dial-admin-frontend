import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import AuditView from '@/src/components/ActivityAudit/View/AuditView';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getActivityAuditDetailData } from '@/src/utils/audit/get-activity-audit-detail-data';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ subId: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const auditViewId = decodeURIComponent((await params.params).subId);

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
      isEntityActivity
    />
  );
}

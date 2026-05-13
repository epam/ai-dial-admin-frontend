import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { activityAuditApi, deploymentAuditApi } from '@/src/app/api/api';
import { pickActivityHandlers } from '@/src/app/[lang]/activity-audit/[id]/resolver';
import { SYSTEM_ROLLBACK_ID } from '@/src/components/ActivityAudit/Rollback/constants';
import SystemRollback from '@/src/components/ActivityAudit/Rollback/SystemRollback';
import AuditView from '@/src/components/ActivityAudit/View/AuditView';
import { DialActivity } from '@/src/models/activity-audit';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { errorObjLog } from '@/src/server/logger';
import { ActivityAuditEntity } from '@/src/types/activity-audit';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let activity: DialActivity | null = null;
  let activityRevision: ActivityAuditEntity | null = null;
  let previousRevision: ActivityAuditEntity | null = null;
  let entity: BaseEntity | undefined = void 0;

  try {
    const auditViewId = decodeURIComponent((await params.params).id);
    if (auditViewId === SYSTEM_ROLLBACK_ID) {
      return <SystemRollback />;
    }

    const adminResponse = await activityAuditApi.getActivityById(auditViewId, token);
    activity = (adminResponse?.response as DialActivity | null) ?? null;
    let isDeploymentActivity = false;

    if (!activity) {
      const deploymentResponse = await deploymentAuditApi.getActivityById(auditViewId, token);
      activity = (deploymentResponse?.response as DialActivity | null) ?? null;
      isDeploymentActivity = activity != null;
    }

    const handlers = activity ? pickActivityHandlers(activity, isDeploymentActivity) : null;
    if (activity && handlers) {
      const [activities, fetchedActivityRevision, fetchedPreviousRevision] = await Promise.all([
        handlers.listActivities(handlers.filter(activity), token),
        handlers.fetchSnapshot(activity, activity.revision, token),
        handlers.fetchSnapshot(activity, activity.revision - 1, token),
      ]);
      activityRevision = fetchedActivityRevision;
      previousRevision = fetchedPreviousRevision;
      const latestRevision = activities?.data?.[0]?.revision;
      if (latestRevision != null) {
        entity = (await handlers.fetchSnapshot(activity, latestRevision, token)) as BaseEntity | undefined;
      }
    } else {
      activity = null;
    }
  } catch (e) {
    errorObjLog(e, 'Failed to fetch activity view data');
  }

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

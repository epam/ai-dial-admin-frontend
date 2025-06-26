import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { ApplicationRoute } from '@/src/types/routes';

import { activityAuditApi } from '@/src/app/api/api';
import { SYSTEM_ROLLBACK_ID } from '@/src/components/ActivityAudit/constants';
import SystemRollback from '@/src/components/ActivityAudit/SystemRollback';
import ActivityAuditView from '@/src/components/ActivityAuditView/ActivityAuditView';
import Page403 from '@/src/components/Page403/Page403';
import { DialActivity } from '@/src/models/dial/activity-audit';
import { logger } from '@/src/server/logger';
import { ActivityAuditEntity } from '@/src/types/activity-audit';
import { getRevisionRouteForEntityType } from '@/src/utils/audit/get-revision-route';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let activity: DialActivity | null = null;
  let activityRevision: ActivityAuditEntity | null = null;
  let previousRevision: ActivityAuditEntity | null = null;

  try {
    const auditViewId = decodeURIComponent((await params.params).id);
    if (auditViewId === SYSTEM_ROLLBACK_ID) {
      return <SystemRollback />;
    }
    activity = await activityAuditApi.getActivityById(auditViewId, token);
    if (activity === void 0) {
      return <Page403 />;
    }
    const route = getRevisionRouteForEntityType(
      activity?.resourceType,
      decodeURIComponent(activity?.resourceId as string),
    );
    if (activity && route) {
      activityRevision = await activityAuditApi.getRevisionDetails(`${route}${activity.revision}`, token);
      previousRevision = await activityAuditApi.getRevisionDetails(`${route}${activity.revision - 1}`, token);
    }
  } catch (e) {
    logger.error('Getting activity view data error', e);
  }

  if (activity == null) {
    redirect(ApplicationRoute.ActivityAudit);
  }

  return (
    <ActivityAuditView activity={activity} activityRevision={activityRevision} previousRevision={previousRevision} />
  );
}
